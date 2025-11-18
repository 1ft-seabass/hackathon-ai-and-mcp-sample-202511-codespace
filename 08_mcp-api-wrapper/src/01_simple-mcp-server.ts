import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

/**
 * シンプルな計算ツールを提供するMCPサーバー
 *
 * このサーバーは以下のツールを提供します:
 * - add: 2つの数値の足し算
 * - multiply: 2つの数値の掛け算
 * - greet: 挨拶メッセージを返す
 */

// MCPサーバーを作成
const server = new Server(
  {
    name: "simple-calculator-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 利用可能なツール一覧を返すハンドラ
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "add",
        description: "2つの数値を足し算します",
        inputSchema: {
          type: "object",
          properties: {
            a: {
              type: "number",
              description: "1つ目の数値",
            },
            b: {
              type: "number",
              description: "2つ目の数値",
            },
          },
          required: ["a", "b"],
        },
      },
      {
        name: "multiply",
        description: "2つの数値を掛け算します",
        inputSchema: {
          type: "object",
          properties: {
            a: {
              type: "number",
              description: "1つ目の数値",
            },
            b: {
              type: "number",
              description: "2つ目の数値",
            },
          },
          required: ["a", "b"],
        },
      },
      {
        name: "greet",
        description: "指定された名前で挨拶します",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "挨拶する相手の名前",
            },
          },
          required: ["name"],
        },
      },
    ],
  };
});

// ツール実行のハンドラ
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;

  // add ツール
  if (toolName === "add") {
    const a = Number(request.params.arguments?.a);
    const b = Number(request.params.arguments?.b);
    const result = a + b;

    return {
      content: [
        {
          type: "text",
          text: `計算結果: ${a} + ${b} = ${result}`,
        },
      ],
    };
  }

  // multiply ツール
  if (toolName === "multiply") {
    const a = Number(request.params.arguments?.a);
    const b = Number(request.params.arguments?.b);
    const result = a * b;

    return {
      content: [
        {
          type: "text",
          text: `計算結果: ${a} × ${b} = ${result}`,
        },
      ],
    };
  }

  // greet ツール
  if (toolName === "greet") {
    const name = String(request.params.arguments?.name);

    return {
      content: [
        {
          type: "text",
          text: `こんにちは、${name}さん！`,
        },
      ],
    };
  }

  // 未知のツール
  return {
    isError: true,
    content: [
      {
        type: "text",
        text: `未知のツール: ${toolName}`,
      },
    ],
  };
});

// 標準入出力でクライアントと通信
const transport = new StdioServerTransport();
await server.connect(transport);

console.error("[MCP Server] simple-calculator-server が起動しました");
