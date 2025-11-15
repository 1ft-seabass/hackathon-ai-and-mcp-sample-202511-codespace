import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import OpenAI from "openai";
import * as readline from "readline/promises";

/**
 * 天気APIラッパーを使う対話型クライアント
 *
 * weather-server.ts と連携して、天気情報を取得します。
 * 実際の外部API（wttr.in）を呼び出す実用的な例です。
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
  args: ["tsx", "src/weather-server.ts"],
});

const client = new Client(
  {
    name: "weather-client",
    version: "1.0.0",
  },
  {
    capabilities: {},
  }
);

await client.connect(transport);
console.log("✅ [MCP Client] 天気APIサーバーに接続しました\n");

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

console.log("💡 ヒント: 「東京の天気を教えて」「ニューヨークは今何度？」など");
console.log("💡 終了するには 'exit' または Ctrl+C を入力してください\n");

const question = await rl.question("あなた > ");

if (question.toLowerCase() === "exit") {
  console.log("\n👋 終了します");
  rl.close();
  await client.close();
  process.exit(0);
}

console.log("");

// ChatGPT API に質問
const response = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: question }],
  tools: toolsResult.tools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    },
  })),
});

const message = response.choices[0].message;

// ツール呼び出しがあれば実行
if (message.tool_calls) {
  console.log("🤖 AI がツールを実行中...\n");

  const toolResults: any[] = [];

  for (const toolCall of message.tool_calls) {
    console.log(`🔧 ツール: ${toolCall.function.name}`);
    console.log(`📝 引数: ${toolCall.function.arguments}`);

    try {
      const result = await client.callTool({
        name: toolCall.function.name,
        arguments: JSON.parse(toolCall.function.arguments),
      });

      toolResults.push(result);

      // 結果を表示
      if (result.content && Array.isArray(result.content) && result.content.length > 0) {
        const textContent = result.content.find((c: any) => c.type === "text");
        if (textContent) {
          console.log(`\n✅ 取得結果:\n${textContent.text}\n`);
        }
      }
    } catch (error) {
      console.error(`❌ ツール実行エラー: ${error}`);
      toolResults.push({
        content: [{ type: "text", text: `エラー: ${error}` }],
      });
    }
  }

  // ツール実行結果をもとに最終的な返答を生成
  const finalResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "user", content: question },
      message,
      ...message.tool_calls!.map((toolCall, index) => ({
        role: "tool" as const,
        tool_call_id: toolCall.id,
        content:
          toolResults[index]?.content?.[0]?.text || "ツール実行に失敗しました",
      })),
    ],
  });

  console.log("💬 AI > " + finalResponse.choices[0].message.content + "\n");
} else {
  // ツールを使わない返答
  console.log("💬 AI > " + message.content + "\n");
}

rl.close();
await client.close();
console.log("[MCP Client] 終了\n");
