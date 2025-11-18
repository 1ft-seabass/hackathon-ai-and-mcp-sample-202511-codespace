// OpenAI API キー
// お使いになる OpenAI API キーに差し替えましょう
const OPENAI_API_KEY = "OPENAI_API_KEY";

// openai ライブラリの読み込み
const OpenAI = require("openai");

// OpenAI の API を使うために上記の設定を割り当てて準備
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

// 天気情報を取得する関数
// wttr.in という無料の天気 API を使用（API キー不要）
async function getWeather(location) {
  // https://github.com/chubin/wttr.in - wttr.in の API 仕様
  const url = `https://wttr.in/${encodeURIComponent(location)}?format=j1`;

  console.log(`天気APIを呼び出し: ${url}`);

  // fetch で API を呼び出す
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

// async つきで実行
async function main() {

  // 質問内容
  const questionText = `東京の天気を教えて`;

  // 実際に ChatGPT にお願いするテキスト
  const promptText = `
ユーザーから天気について質問されたら、get_weather ツールを使って天気情報を取得してください。

ユーザーの質問: ${questionText}
`;

  console.log("実際に ChatGPT にお願いするテキスト");
  console.log(promptText);

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

    console.log("\nAI が選択したツール:");
    console.log(`- ツール名: ${toolCall.function.name}`);
    console.log(`- 引数: ${JSON.stringify(functionArgs)}`);

    // 実際に天気 API を呼び出す
    console.log("\n--- 実際に天気APIを呼び出します ---");
    const weatherData = await getWeather(functionArgs.location);

    console.log("\n取得した天気情報:");
    console.log(weatherData);
  } else {
    console.log("ツールが呼び出されませんでした");
  }

}

// 実行
main();
