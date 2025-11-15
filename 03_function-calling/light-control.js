// OpenAI API キー
// お使いになる OpenAI API キーに差し替えましょう
const OPENAI_API_KEY = "OPENAI_API_KEY";

// openai ライブラリの読み込み
const OpenAI = require("openai");

// OpenAI の API を使うために上記の設定を割り当てて準備
// 以後 openai というオブジェクトで使える
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

// async つきで実行
// 外部の API (OpenAPI) とのやり取りが伴うので待つ処理が必要
async function main() {

  // 質問内容
  const questionText = `ライトをつけて`;

  // 実際に ChatGPT にお願いするテキスト
  // テンプレートリテラルのバッククォート「`」を使っているので複数行できる
  const promptText = `
- 「ライトをつけて」とお願いしたら on_command を使います
- 「ライトを消して」とお願いしたら off_command を使います

今回のお願いは「${questionText}」です。
`;

  console.log("実際に ChatGPT にお願いするテキスト");
  console.log(promptText);

  // Tools の設定（新記法）
  const tools = [
    {
        "type": "function",
        "function": {
            "name": "on_command",
            "description": "「ライトをつけて」とお願いしたときに使います。",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {
                        "type": "string",
                        "description": "on が固定値で入ります"
                    }
                },
                "required": [
                    "command"
                ]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "off_command",
            "description": "「ライトを消して」とお願いしたときに使います。",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {
                        "type": "string",
                        "description": "off が固定値で入ります"
                    }
                },
                "required": [
                    "command"
                ]
            }
        }
    }
  ];

  // ChatGPT API に実際にアクセス（新記法）
  // https://platform.openai.com/docs/guides/gpt/chat-completions-api?lang=node.js
  // https://platform.openai.com/docs/guides/gpt/function-calling
  const completion = await openai.chat.completions.create({
    messages: [
      // 質問内容
      { role: "user", content: promptText }
    ],
    // Tools を使うためにモデルは gpt-4o を使います。
    model: "gpt-4o",
    tools: tools,
    tool_choice: "auto"
  });

  // tool calls の結果取得（新記法）
  if (completion.choices[0].message.tool_calls) {
    const toolCall = completion.choices[0].message.tool_calls[0];
    const functionData = JSON.parse(toolCall.function.arguments);

    console.log("tool calls の結果取得");
    console.log(functionData);
  }

}

// 実行
main();
