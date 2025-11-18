// OpenAI API キー
// お使いになる OpenAI API キーに差し替えましょう
const OPENAI_API_KEY = "OPENAI_API_KEY";

// openai ライブラリの読み込み
const OpenAI = require("openai");
// readline で標準入力を扱う
const readline = require("readline");

// OpenAI の API を使うために上記の設定を割り当てて準備
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

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

// AI に天気を問い合わせてツールを実行する関数
async function askWeather(location) {
  const promptText = `${location}の天気を教えてください。`;

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

  // ChatGPT API に実際にアクセス
  const completion = await openai.chat.completions.create({
    messages: [
      { role: "user", content: promptText }
    ],
    model: "gpt-4o",
    tools: tools,
    tool_choice: "auto"
  });

  // tool calls の結果取得
  if (completion.choices[0].message.tool_calls) {
    const toolCall = completion.choices[0].message.tool_calls[0];
    const functionArgs = JSON.parse(toolCall.function.arguments);

    // 実際に天気 API を呼び出す
    const weatherData = await getWeather(functionArgs.location);
    return weatherData;
  } else {
    return null;
  }
}

// 対話ループのメイン関数
async function main() {
  console.log("=== 天気チャット ===");
  console.log("場所を入力すると天気を調べます。");
  console.log("終了するには「exit」と入力してください。\n");

  // readline のインターフェースを作成
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // 質問を繰り返す関数
  const askLocation = () => {
    rl.question("どの場所の天気を知りたいですか？ > ", async (answer) => {
      const input = answer.trim();

      // 終了条件
      if (input.toLowerCase() === "exit" || input === "") {
        console.log("\n終了します。");
        rl.close();
        return;
      }

      try {
        console.log(`\n${input} の天気を調べています...\n`);

        // AI に問い合わせて天気を取得
        const weatherData = await askWeather(input);

        if (weatherData) {
          console.log("--- 天気情報 ---");
          console.log(`場所: ${weatherData.location}`);
          console.log(`気温: ${weatherData.temperature}`);
          console.log(`天気: ${weatherData.condition}`);
          console.log(`湿度: ${weatherData.humidity}`);
          console.log(`風速: ${weatherData.windSpeed}`);
          console.log("");
        } else {
          console.log("天気情報を取得できませんでした。\n");
        }

        // 次の質問へ
        askLocation();
      } catch (error) {
        console.error("エラーが発生しました:", error.message);
        console.log("");
        // エラーが出ても続行
        askLocation();
      }
    });
  };

  // 最初の質問を開始
  askLocation();
}

// 実行
main();
