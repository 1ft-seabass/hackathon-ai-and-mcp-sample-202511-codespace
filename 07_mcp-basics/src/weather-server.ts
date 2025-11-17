import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

/**
 * 天気API（wttr.in）をラップするMCPサーバー
 *
 * このサーバーは外部API（wttr.in）を呼び出して天気情報を提供します。
 * ハッカソンでの実用的な外部API統合の例として参考にしてください。
 */

// 天気情報を取得する関数
async function getWeather(location: string): Promise<string> {
  try {
    // wttr.in API を使用（API キー不要）
    // 参考: https://github.com/chubin/wttr.in
    const url = `https://wttr.in/${encodeURIComponent(location)}?format=j1`;

    console.error(`[Weather API] 呼び出し: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // 必要な情報だけ抽出して整形
    const current = data.current_condition[0];
    const weatherInfo = {
      location: location,
      temperature: `${current.temp_C}°C`,
      condition: current.weatherDesc[0].value,
      humidity: `${current.humidity}%`,
      windSpeed: `${current.windspeedKmph} km/h`,
      feelsLike: `${current.FeelsLikeC}°C`,
    };

    return JSON.stringify(weatherInfo, null, 2);
  } catch (error) {
    console.error(`[Weather API] エラー:`, error);
    throw new Error(
      `天気情報の取得に失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`
    );
  }
}

// MCPサーバーを作成
const server = new Server(
  {
    name: "weather-api-server",
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
        name: "get_weather",
        description:
          "指定された場所の現在の天気情報を取得します（気温、天候、湿度、風速など）",
        inputSchema: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description:
                "天気を取得したい場所（例: Tokyo, Osaka, New York, London）",
            },
          },
          required: ["location"],
        },
      },
    ],
  };
});

// ツール実行のハンドラ
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;

  if (toolName === "get_weather") {
    const location = String(request.params.arguments?.location);

    try {
      const weatherData = await getWeather(location);

      return {
        content: [
          {
            type: "text",
            text: `${location}の天気情報:\n\n${weatherData}`,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `エラー: ${error instanceof Error ? error.message : "天気情報の取得に失敗しました"}`,
          },
        ],
      };
    }
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

console.error("[MCP Server] weather-api-server が起動しました");
