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

// メモを保存する配列（シンプルな実装）
const memos = [];

// メモ管理の Tool 定義
const tools = [
  {
    "type": "function",
    "function": {
      "name": "add_memo",
      "description": "新しいメモを追加します",
      "parameters": {
        "type": "object",
        "properties": {
          "content": {
            "type": "string",
            "description": "メモの内容"
          }
        },
        "required": ["content"]
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "list_memos",
      "description": "すべてのメモを一覧表示します",
      "parameters": {
        "type": "object",
        "properties": {}
      }
    }
  },
  {
    "type": "function",
    "function": {
      "name": "delete_memo",
      "description": "指定された番号のメモを削除します",
      "parameters": {
        "type": "object",
        "properties": {
          "index": {
            "type": "number",
            "description": "削除するメモの番号（1から始まる）"
          }
        },
        "required": ["index"]
      }
    }
  }
];

// ツールの実行
function executeTool(toolName, args) {
  switch (toolName) {
    case "add_memo":
      memos.push(args.content);
      return `メモを追加しました: "${args.content}"`;

    case "list_memos":
      if (memos.length === 0) {
        return "メモはまだありません。";
      }
      const list = memos.map((memo, index) => `${index + 1}. ${memo}`).join("\n");
      return `現在のメモ:\n${list}`;

    case "delete_memo":
      const index = args.index - 1; // 1始まりを0始まりに変換
      if (index < 0 || index >= memos.length) {
        return `エラー: メモ番号 ${args.index} は存在しません。`;
      }
      const deleted = memos.splice(index, 1)[0];
      return `メモを削除しました: "${deleted}"`;

    default:
      return "不明なツールです。";
  }
}

// 対話ループのメイン関数
async function main() {
  console.log("=== メモチャット ===");
  console.log("メモの追加・表示・削除ができます。");
  console.log("例: 「買い物リストを追加して」「メモを見せて」「1番目のメモを削除」");
  console.log("終了するには「exit」と入力してください。\n");

  // 会話履歴を保持する配列（継続会話のポイント！）
  const messages = [
    {
      role: "system",
      content: "あなたは親切なメモ管理アシスタントです。ユーザーのメモ管理をサポートしてください。"
    }
  ];

  // readline のインターフェースを作成
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // 質問を繰り返す関数
  const askUser = () => {
    rl.question("あなた > ", async (answer) => {
      const input = answer.trim();

      // 終了条件
      if (input.toLowerCase() === "exit" || input === "") {
        console.log("\n終了します。");
        rl.close();
        return;
      }

      try {
        // ユーザーのメッセージを履歴に追加
        messages.push({ role: "user", content: input });

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
          // アシスタントのメッセージを履歴に追加（tool_calls 含む）
          messages.push(responseMessage);

          // 各ツールを実行
          for (const toolCall of responseMessage.tool_calls) {
            const functionName = toolCall.function.name;
            const functionArgs = JSON.parse(toolCall.function.arguments);

            console.log(`\n[ツール実行: ${functionName}]`);

            // ツールを実行
            const result = executeTool(functionName, functionArgs);

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
          console.log(`\nアシスタント: ${finalResponse}\n`);

          // 最終的な返答も履歴に追加
          messages.push({
            role: "assistant",
            content: finalResponse
          });

        } else {
          // ツール呼び出しがない場合は、通常の会話
          const reply = responseMessage.content;
          console.log(`\nアシスタント: ${reply}\n`);

          // アシスタントの返答を履歴に追加
          messages.push({
            role: "assistant",
            content: reply
          });
        }

        // 次の質問へ
        askUser();

      } catch (error) {
        console.error("\nエラーが発生しました:", error.message);
        console.log("");
        // エラーが出ても続行
        askUser();
      }
    });
  };

  // 最初の質問を開始
  askUser();
}

// 実行
main();
