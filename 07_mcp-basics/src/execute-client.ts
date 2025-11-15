import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import OpenAI from "openai";

/**
 * MCP 動作確認用クライアント（会話固定版）
 *
 * simple-server.ts と連携して、MCPの基本動作を確認するサンプルです。
 * 固定の質問で動作確認できるため、初めてのMCP体験に最適です。
 */

// OpenAI API キーを環境変数または直接指定
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "your-api-key-here";

// OpenAI クライアント初期化
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// MCP クライアント作成（サーバーコマンドを指定）
const transport = new StdioClientTransport({
  command: "npx",
  args: ["tsx", "src/simple-server.ts"],
});

const client = new Client(
  {
    name: "mcp-execute-client",
    version: "1.0.0",
  },
  {
    capabilities: {},
  }
);

await client.connect(transport);
console.log("[MCP Client] サーバーに接続しました\n");

// MCP サーバーからツール一覧を取得
const toolsResult = await client.listTools();
console.log("✅ 利用可能なツール:");
console.log(JSON.stringify(toolsResult.tools, null, 2));
console.log("");

// 固定の質問で動作確認
const question = "5と3を足してください";
console.log(`💬 質問: ${question}\n`);

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
console.log("🤖 ChatGPT の応答:");
console.log(JSON.stringify(message, null, 2));
console.log("");

// ツール呼び出しがあれば実行
if (message.tool_calls) {
  for (const toolCall of message.tool_calls) {
    console.log(`🔧 ツール実行: ${toolCall.function.name}`);
    console.log(`📝 引数: ${toolCall.function.arguments}`);

    const result = await client.callTool({
      name: toolCall.function.name,
      arguments: JSON.parse(toolCall.function.arguments),
    });

    console.log("📊 結果:");
    console.log(JSON.stringify(result, null, 2));
    console.log("");
  }
} else {
  console.log("ℹ️  (ツールは呼び出されませんでした)");
}

await client.close();
console.log("[MCP Client] 終了\n");
