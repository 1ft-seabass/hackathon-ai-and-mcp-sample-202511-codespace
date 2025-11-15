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

// 会話を実行する関数
// messages 配列と新しいユーザーメッセージを受け取り、
// API を呼び出して返答を得る
async function chat(messages, userMessage) {
  // ユーザーのメッセージを履歴に追加
  messages.push({ role: "user", content: userMessage });

  console.log(`ユーザー: ${userMessage}`);

  // ChatGPT API にアクセス
  const completion = await openai.chat.completions.create({
    messages: messages,
    model: "gpt-4o-mini"
  });

  // 返答を取得
  const assistantMessage = completion.choices[0].message.content;
  console.log(`アシスタント: ${assistantMessage}\n`);

  // アシスタントの返答も履歴に追加
  messages.push({ role: "assistant", content: assistantMessage });

  return assistantMessage;
}

// async つきで実行
async function main() {

  console.log("=== 文脈を保持した会話のサンプル ===\n");
  console.log("実際の会話シナリオ: レストランの予約相談\n");

  // システムメッセージで役割を設定
  // これにより一貫した振る舞いを維持できる
  const messages = [
    {
      role: "system",
      content: "あなたは親切なレストラン予約アシスタントです。ユーザーの希望を丁寧に聞き取り、適切な提案をしてください。"
    }
  ];

  // ========================================
  // 会話シナリオ: レストランの予約
  // ========================================

  console.log("--- ステップ 1: 日時の確認 ---");
  await chat(messages, "来週の金曜日の夜に予約したいです。");

  console.log("--- ステップ 2: 人数の追加情報 ---");
  await chat(messages, "4人で行く予定です。");

  console.log("--- ステップ 3: 好みの追加（文脈依存） ---");
  await chat(messages, "和食が良いです。個室はありますか？");

  console.log("--- ステップ 4: 過去の情報を参照 ---");
  await chat(messages, "予算は一人あたりどのくらいで見積もればいいですか？");

  console.log("--- ステップ 5: まとめの確認（全文脈参照） ---");
  await chat(messages, "これまでの情報をまとめて確認してください。");

  // ========================================
  // 会話履歴の確認
  // ========================================
  console.log("=== 会話履歴 ===");
  console.log(`メッセージ数: ${messages.length}`);
  console.log("\n各メッセージ:");
  messages.forEach((msg, index) => {
    const preview = msg.content.substring(0, 50) + (msg.content.length > 50 ? "..." : "");
    console.log(`${index + 1}. [${msg.role}] ${preview}`);
  });

  console.log("\n=== 重要ポイント ===");
  console.log("1. システムメッセージで役割を定義できる");
  console.log("2. 各ターンで過去の文脈を自動的に参照する");
  console.log("3. ユーザーは明示的に過去の情報を繰り返さなくてよい");
  console.log("4. 「これまでの情報」のような参照が可能");
  console.log("5. メッセージ配列が長くなるとトークン数が増える点に注意");
}

// 実行
main();
