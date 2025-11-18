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

  console.log("=== シンプルな継続会話のサンプル ===\n");
  console.log("これまでのワンショット（1回の質問・回答）から、");
  console.log("継続的な会話（複数ターン）に進化させます。\n");

  // メッセージ履歴を保持する配列
  // これがポイント！会話を続けるにはメッセージの履歴が必要
  const messages = [];

  // ========================================
  // 1ターン目: 自己紹介をお願いする
  // ========================================
  console.log("--- 1ターン目 ---");
  const userMessage1 = "こんにちは！あなたの名前を教えてください。";
  console.log(`ユーザー: ${userMessage1}`);

  // メッセージ履歴に追加
  messages.push({ role: "user", content: userMessage1 });

  // ChatGPT API にアクセス
  const completion1 = await openai.chat.completions.create({
    messages: messages,  // 履歴全体を送る
    model: "gpt-4o-mini"
  });

  // 返答を取得
  const assistantMessage1 = completion1.choices[0].message.content;
  console.log(`アシスタント: ${assistantMessage1}\n`);

  // アシスタントの返答も履歴に追加（重要！）
  messages.push({ role: "assistant", content: assistantMessage1 });

  // ========================================
  // 2ターン目: 前の会話を参照する質問
  // ========================================
  console.log("--- 2ターン目 ---");
  const userMessage2 = "あなたの名前を短く省略すると何になりますか？";
  console.log(`ユーザー: ${userMessage2}`);

  // メッセージ履歴に追加
  messages.push({ role: "user", content: userMessage2 });

  // ChatGPT API にアクセス（同じ messages 配列を使う）
  const completion2 = await openai.chat.completions.create({
    messages: messages,  // これまでの会話履歴全部が含まれている
    model: "gpt-4o-mini"
  });

  // 返答を取得
  const assistantMessage2 = completion2.choices[0].message.content;
  console.log(`アシスタント: ${assistantMessage2}\n`);

  // アシスタントの返答も履歴に追加
  messages.push({ role: "assistant", content: assistantMessage2 });

  // ========================================
  // 3ターン目: さらに会話を続ける
  // ========================================
  console.log("--- 3ターン目 ---");
  const userMessage3 = "最初に私が何と言ったか覚えていますか？";
  console.log(`ユーザー: ${userMessage3}`);

  // メッセージ履歴に追加
  messages.push({ role: "user", content: userMessage3 });

  // ChatGPT API にアクセス
  const completion3 = await openai.chat.completions.create({
    messages: messages,
    model: "gpt-4o-mini"
  });

  // 返答を取得
  const assistantMessage3 = completion3.choices[0].message.content;
  console.log(`アシスタント: ${assistantMessage3}\n`);

  // アシスタントの返答も履歴に追加
  messages.push({ role: "assistant", content: assistantMessage3 });

  // ========================================
  // 最後に履歴全体を表示
  // ========================================
  console.log("=== 会話履歴の全体 ===");
  console.log(JSON.stringify(messages, null, 2));
  console.log("\nポイント:");
  console.log("- messages 配列に会話履歴を順番に追加していく");
  console.log("- ユーザーの発言も、アシスタントの返答も、両方とも履歴に追加する");
  console.log("- API には毎回、履歴全体を送信する");
  console.log("- これにより、ChatGPT は過去の文脈を理解して返答できる");
}

// 実行
main();
