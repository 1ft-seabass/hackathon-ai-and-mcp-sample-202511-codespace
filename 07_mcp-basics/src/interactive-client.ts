import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import OpenAI from "openai";
import * as readline from "readline/promises";

/**
 * MCP 対話型クライアント
 *
 * simple-server.ts と連携して、ユーザーからの質問を受け付けます。
 * AIが自動的にツールを選択・実行するため、自然な対話が可能です。
 */

// OpenAI API キー
// お使いになる OpenAI API キーに差し替えましょう
const OPENAI_API_KEY = "OPENAI_API_KEY";

// OpenAI クライアント初期化
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// MCP クライアント作成
const transport = new StdioClientTransport({
  command: "npx",
  args: ["tsx", "src/simple-server.ts"],
});

const client = new Client(
  {
    name: "mcp-interactive-client",
    version: "1.0.0",
  },
  {
    capabilities: {},
  }
);

await client.connect(transport);
console.log("✅ [MCP Client] サーバーに接続しました\n");

// MCP サーバーからツール一覧を取得
const toolsResult = await client.listTools();
console.log("📋 利用可能なツール:");
toolsResult.tools.forEach((tool) => {
  console.log(`  - ${tool.name}: ${tool.description}`);
});
console.log("");

// readline でユーザー入力を受け付ける
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("💡 ヒント: 「5と3を足して」「10と7を掛けて」「太郎さんに挨拶して」など");
console.log("💡 終了するには 'exit' または Ctrl+C を入力してください\n");

// 会話履歴を保持する配列（継続会話のポイント！）
const messages: any[] = [];

// ツール定義（OpenAI API用に変換）
const tools = toolsResult.tools.map((tool) => ({
  type: "function" as const,
  function: {
    name: tool.name,
    description: tool.description,
    parameters: tool.inputSchema,
  },
}));

// 質問を繰り返す関数
const askUser = async () => {
  const question = await rl.question("あなた > ");

  // 終了条件
  if (question.toLowerCase() === "exit" || question.trim() === "") {
    console.log("\n👋 終了します");
    rl.close();
    await client.close();
    process.exit(0);
  }

  console.log("");

  try {
    // ユーザーのメッセージを履歴に追加
    messages.push({ role: "user", content: question });

    // ChatGPT API に質問
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      tools: tools,
    });

    const message = response.choices[0].message;

    // ツール呼び出しがあれば実行
    if (message.tool_calls) {
      console.log("🤖 AI がツールを実行中...\n");

      // アシスタントのメッセージを履歴に追加（tool_calls 含む）
      messages.push(message);

      const toolResults: any[] = [];

      for (const toolCall of message.tool_calls) {
        console.log(`🔧 ツール: ${toolCall.function.name}`);
        console.log(`📝 引数: ${toolCall.function.arguments}`);

        const result = await client.callTool({
          name: toolCall.function.name,
          arguments: JSON.parse(toolCall.function.arguments),
        });

        toolResults.push(result);

        // 結果を表示とツール実行結果を履歴に追加
        let toolResultText = "ツール実行に失敗しました";
        if (result.content && Array.isArray(result.content) && result.content.length > 0) {
          const textContent = result.content.find((c: any) => c.type === "text");
          if (textContent) {
            toolResultText = textContent.text;
            console.log(`✅ ${textContent.text}\n`);
          }
        }

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: toolResultText,
        });
      }

      // ツール実行結果をもとに最終的な返答を生成
      const finalResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages,
      });

      const finalContent = finalResponse.choices[0].message.content;
      console.log("💬 AI > " + finalContent + "\n");

      // 最終的な返答も履歴に追加
      messages.push({
        role: "assistant",
        content: finalContent,
      });
    } else {
      // ツールを使わない返答
      console.log("💬 AI > " + message.content + "\n");

      // アシスタントの返答を履歴に追加
      messages.push({
        role: "assistant",
        content: message.content,
      });
    }

    // 次の質問へ
    askUser();
  } catch (error) {
    console.error(`\n❌ エラーが発生しました: ${error}`);
    console.log("");
    // エラーが出ても続行
    askUser();
  }
};

// 最初の質問を開始
askUser();
