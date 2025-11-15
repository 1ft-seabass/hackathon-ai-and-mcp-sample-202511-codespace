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

// メモを保存する配列（サーバー起動中は保持される）
// 本番環境では DB に保存すべき
let memos = [];

// 会話履歴を保持する
// 本番環境では Redis や DB に保存すべき
let messages = [
  {
    role: "system",
    content: "あなたは親切なメモ管理アシスタントです。ユーザーのメモ管理をサポートしてください。"
  }
];

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
      console.log(`[返答] ${finalResponse}`);

      // 最終的な返答も履歴に追加
      messages.push({
        role: "assistant",
        content: finalResponse
      });

      return res.json({
        response: finalResponse,
        messageCount: messages.length,
        memoCount: memos.length
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
        messageCount: messages.length,
        memoCount: memos.length
      });
    }

  } catch (error) {
    console.error("エラー:", error);
    return res.status(500).json({ error: error.message });
  }
});

// POST /clear - 会話履歴をクリア（メモは残す）
app.post("/clear", (req, res) => {
  const previousCount = messages.length;

  // システムメッセージだけ残して履歴をクリア
  messages = [
    {
      role: "system",
      content: "あなたは親切なメモ管理アシスタントです。ユーザーのメモ管理をサポートしてください。"
    }
  ];

  console.log(`[履歴クリア] ${previousCount} メッセージを削除（メモは保持）`);

  return res.json({
    message: "会話履歴をクリアしました（メモは保持されています）",
    previousMessageCount: previousCount,
    memoCount: memos.length
  });
});

// GET / - サーバー稼働確認
app.get("/", (req, res) => {
  res.json({
    service: "Memo Interactive Chat Server",
    endpoints: {
      "POST /message": "メッセージを送信（会話継続）",
      "POST /clear": "会話履歴をクリア（メモは保持）"
    },
    currentMessageCount: messages.length,
    memoCount: memos.length,
    memos: memos
  });
});

// サーバー起動
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`=== Memo Interactive Chat Server ===`);
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
  console.log(`\n使い方:`);
  console.log(`  POST /message - メッセージを送信`);
  console.log(`  POST /clear   - 会話履歴をクリア（メモは保持）`);
  console.log(`\nテスト例（別のターミナルで実行）:`);
  console.log(`  curl -X POST http://localhost:${PORT}/message -H "Content-Type: application/json" -d '{"message":"買い物リストを追加"}'`);
  console.log(`  curl -X POST http://localhost:${PORT}/message -H "Content-Type: application/json" -d '{"message":"牛乳も追加"}'`);
  console.log(`  curl -X POST http://localhost:${PORT}/message -H "Content-Type: application/json" -d '{"message":"メモを見せて"}'`);
  console.log(`  curl -X POST http://localhost:${PORT}/clear`);
});
