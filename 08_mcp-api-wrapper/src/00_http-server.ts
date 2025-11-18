import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import OpenAI from "openai";
import express from "express";

/**
 * MCP HTTP API ラッパーサーバー
 *
 * 07の MCP サーバー（simple-server または weather-server）を HTTP API 化します。
 * 06と同じように /message エンドポイントで会話を継続できます。
 */

// OpenAI API キー
// お使いになる OpenAI API キーに差し替えましょう
const OPENAI_API_KEY = "OPENAI_API_KEY";

// OpenAI クライアント初期化
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Express アプリを作成
const app = express();
app.use(express.json()); // JSON リクエストボディを解析

// 会話履歴を保持する（サーバー起動中は保持される）
// 本番環境では Redis や DB に保存すべき
let messages: any[] = [];

// MCP サーバーのツール一覧（起動時に取得）
let mcpTools: any[] = [];

// MCP クライアントのセットアップ
async function setupMCPClient() {
  // MCP サーバーを起動（01_simple-mcp-server または 02_weather-mcp-server を選択）
  // デフォルトは 01_simple-mcp-server
  const mcpServerScript = process.env.MCP_SERVER || "01_simple-mcp-server.ts";

  console.log(`[MCP Setup] ${mcpServerScript} を起動します...`);

  const transport = new StdioClientTransport({
    command: "npx",
    args: ["tsx", `./${mcpServerScript}`],
  });

  const client = new Client(
    {
      name: "mcp-http-wrapper",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);
  console.log("✅ [MCP Client] サーバーに接続しました");

  // ツール一覧を取得
  const toolsResult = await client.listTools();
  mcpTools = toolsResult.tools.map((tool) => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    },
  }));

  console.log("📋 利用可能なツール:");
  toolsResult.tools.forEach((tool) => {
    console.log(`  - ${tool.name}: ${tool.description}`);
  });
  console.log("");

  return client;
}

// MCP クライアントを起動時に初期化
const mcpClient = await setupMCPClient();

// POST /message - メッセージを送信して返答を得る
app.post("/message", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    console.log(`[受信] ${message}`);

    // ユーザーのメッセージを履歴に追加
    messages.push({ role: "user", content: message });

    // OpenAI API に質問
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      tools: mcpTools,
    });

    const responseMessage = response.choices[0].message;

    // ツール呼び出しがある場合
    if (responseMessage.tool_calls) {
      // アシスタントのメッセージを履歴に追加（tool_calls 含む）
      messages.push(responseMessage);

      // 各ツールを実行
      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        console.log(`[ツール実行] ${functionName}(${JSON.stringify(functionArgs)})`);

        // MCP サーバーのツールを呼び出し
        const result = await mcpClient.callTool({
          name: functionName,
          arguments: functionArgs,
        });

        // ツール実行結果を履歴に追加
        let toolResultText = "ツール実行に失敗しました";
        if (result.content && Array.isArray(result.content) && result.content.length > 0) {
          const textContent = result.content.find((c: any) => c.type === "text");
          if (textContent) {
            toolResultText = textContent.text;
          }
        }

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: toolResultText,
        });
      }

      // ツール実行後、再度 API を呼び出して最終的な返答を得る
      const finalCompletion = await openai.chat.completions.create({
        messages: messages,
        model: "gpt-4o-mini",
      });

      const finalResponse = finalCompletion.choices[0].message.content;
      console.log(`[返答] ${finalResponse}`);

      // 最終的な返答も履歴に追加
      messages.push({
        role: "assistant",
        content: finalResponse,
      });

      return res.json({
        response: finalResponse,
        messageCount: messages.length,
      });
    } else {
      // ツール呼び出しがない場合は、通常の会話
      const reply = responseMessage.content;
      console.log(`[返答] ${reply}`);

      // アシスタントの返答を履歴に追加
      messages.push({
        role: "assistant",
        content: reply,
      });

      return res.json({
        response: reply,
        messageCount: messages.length,
      });
    }
  } catch (error) {
    console.error("エラー:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /clear - 会話履歴をクリア
app.post("/clear", (req, res) => {
  const previousCount = messages.length;
  messages = [];
  console.log(`[履歴クリア] ${previousCount} メッセージを削除`);

  return res.json({
    message: "会話履歴をクリアしました",
    previousMessageCount: previousCount,
  });
});

// GET / - サーバー稼働確認
app.get("/", (req, res) => {
  const mcpServerScript = process.env.MCP_SERVER || "simple-server.ts";

  res.json({
    service: "MCP HTTP API Wrapper",
    mcpServer: mcpServerScript,
    availableTools: mcpTools.map((t) => t.function.name),
    endpoints: {
      "POST /message": "メッセージを送信（会話継続）",
      "POST /clear": "会話履歴をクリア",
    },
    currentMessageCount: messages.length,
  });
});

// サーバー起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`=== MCP HTTP API Wrapper ===`);
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
  console.log(`\n使い方:`);
  console.log(`  POST /message - メッセージを送信`);
  console.log(`  POST /clear   - 会話履歴をクリア`);
  console.log(`\nテスト例（別のターミナルで実行）:`);
  console.log(`  curl -X POST http://localhost:${PORT}/message -H "Content-Type: application/json" -d '{"message":"5と3を足して"}'`);
  console.log(`  curl -X POST http://localhost:${PORT}/message -H "Content-Type: application/json" -d '{"message":"さっきの結果を2倍にして"}'`);
  console.log(`  curl -X POST http://localhost:${PORT}/clear`);
  console.log(`\nMCPサーバーを切り替えるには:`);
  console.log(`  MCP_SERVER=weather-server.ts npm start`);
});
