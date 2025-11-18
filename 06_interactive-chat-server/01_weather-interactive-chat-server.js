// OpenAI API キー
// お使いになる OpenAI API キーに差し替えましょう
const OPENAI_API_KEY = "OPENAI_API_KEY";

// openai ライブラリの読み込み
const OpenAI = require("openai");
// Express で Web サーバーを立てる
const express = require("express");

// OpenAI の API を使うために上記の設定を割り当てて準備
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

// Express アプリを作成
const app = express();
app.use(express.json()); // JSON リクエストボディを解析

// 会話履歴を保持する（サーバー起動中は保持される）
// 本番環境では Redis や DB に保存すべき
let messages = [];

// 天気情報を取得する関数
// wttr.in という無料の天気 API を使用（API キー不要）
async function getWeather(location) {
  const url = `https://wttr.in/${encodeURIComponent(location)}?format=j1`;
  const response = await fetch(url);
  const data = await response.json();

  // 必要な情報だけ抽出して整形
  const current = data.current_condition[0];
  const weatherInfo = {
    location: location,
    temperature: `${current.temp_C}°C`,
    condition: current.weatherDesc[0].value,
    humidity: `${current.humidity}%`,
    windSpeed: `${current.windspeedKmph} km/h`
  };

  return weatherInfo;
}

// Tools の設定
const tools = [
  {
    "type": "function",
    "function": {
      "name": "get_weather",
      "description": "指定された場所の天気情報を取得します",
      "parameters": {
        "type": "object",
        "properties": {
          "location": {
            "type": "string",
            "description": "天気を取得したい場所（例: Tokyo, Osaka, New York）"
          }
        },
        "required": ["location"]
      }
    }
  }
];

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

    // ChatGPT API にアクセス
    const completion = await openai.chat.completions.create({
      messages: messages,
      model: "gpt-4o",
      tools: tools,
      tool_choice: "auto"
    });

    const responseMessage = completion.choices[0].message;

    // ツール呼び出しがある場合
    if (responseMessage.tool_calls) {
      // アシスタントのメッセージを履歴に追加
      messages.push(responseMessage);

      // 各ツールを実行
      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        console.log(`[ツール実行] ${functionName}(${JSON.stringify(functionArgs)})`);

        // 天気情報を取得
        const weatherData = await getWeather(functionArgs.location);
        const result = JSON.stringify(weatherData);

        // ツール実行結果を履歴に追加
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result
        });
      }

      // ツール実行後、再度 API を呼び出して最終的な返答を得る
      const finalCompletion = await openai.chat.completions.create({
        messages: messages,
        model: "gpt-4o"
      });

      const finalResponse = finalCompletion.choices[0].message.content;
      console.log(`[返答] ${finalResponse}`);

      // 最終的な返答も履歴に追加
      messages.push({
        role: "assistant",
        content: finalResponse
      });

      return res.json({
        response: finalResponse,
        messageCount: messages.length
      });

    } else {
      // ツール呼び出しがない場合は、通常の会話
      const reply = responseMessage.content;
      console.log(`[返答] ${reply}`);

      // アシスタントの返答を履歴に追加
      messages.push({
        role: "assistant",
        content: reply
      });

      return res.json({
        response: reply,
        messageCount: messages.length
      });
    }

  } catch (error) {
    console.error("エラー:", error);
    return res.status(500).json({ error: error.message });
  }
});

// POST /clear - 会話履歴をクリア
app.post("/clear", (req, res) => {
  const previousCount = messages.length;
  messages = [];
  console.log(`[履歴クリア] ${previousCount} メッセージを削除`);

  return res.json({
    message: "会話履歴をクリアしました",
    previousMessageCount: previousCount
  });
});

// GET / - サーバー稼働確認
app.get("/", (req, res) => {
  res.json({
    service: "Weather Interactive Chat Server",
    endpoints: {
      "POST /message": "メッセージを送信（会話継続）",
      "POST /clear": "会話履歴をクリア"
    },
    currentMessageCount: messages.length
  });
});

// サーバー起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`=== Weather Interactive Chat Server ===`);
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
  console.log(`\n使い方:`);
  console.log(`  POST /message - メッセージを送信`);
  console.log(`  POST /clear   - 会話履歴をクリア`);
  console.log(`\nテスト例（別のターミナルで実行）:`);
  console.log(`  curl -X POST http://localhost:${PORT}/message -H "Content-Type: application/json" -d '{"message":"東京の天気を教えて"}'`);
  console.log(`  curl -X POST http://localhost:${PORT}/clear`);
});
