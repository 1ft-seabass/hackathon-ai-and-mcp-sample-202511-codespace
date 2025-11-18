// OpenAI API キー
// お使いになる OpenAI API キーに差し替えましょう
const OPENAI_API_KEY = "OPENAI_API_KEY";

// openai ライブラリの読み込み
const OpenAI = require("openai");

// OpenAI の API を使うために上記の設定を割り当てて準備
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

// テックニュースを取得する関数
// Hacker News API を使用（完全無料、API キー不要）
async function getTechNews(count) {
  console.log(`\nHacker News API からトップ ${count} 件を取得します...`);

  // Step 1: トップストーリーのIDリストを取得
  const topStoriesUrl = 'https://hacker-news.firebaseio.com/v0/topstories.json';
  const topStoriesResponse = await fetch(topStoriesUrl);
  const topStoryIds = await topStoriesResponse.json();

  // Step 2: 上位N件の記事詳細を取得
  const newsItems = [];
  for (let i = 0; i < Math.min(count, topStoryIds.length); i++) {
    const itemId = topStoryIds[i];
    const itemUrl = `https://hacker-news.firebaseio.com/v0/item/${itemId}.json`;
    const itemResponse = await fetch(itemUrl);
    const item = await itemResponse.json();

    newsItems.push({
      title: item.title,
      url: item.url || `https://news.ycombinator.com/item?id=${itemId}`,
      score: item.score,
      author: item.by
    });
  }

  return newsItems;
}

// async つきで実行
async function main() {

  // 質問内容
  const questionText = `最新のテックニュースを3件教えて`;

  // 実際に ChatGPT にお願いするテキスト
  const promptText = `
ユーザーからテックニュースについて質問されたら、get_tech_news ツールを使ってHacker Newsから最新情報を取得してください。

ユーザーの質問: ${questionText}
`;

  console.log("実際に ChatGPT にお願いするテキスト");
  console.log(promptText);

  // Tools の設定
  const tools = [
    {
      "type": "function",
      "function": {
        "name": "get_tech_news",
        "description": "Hacker Newsから最新のテクノロジーニュースを取得します",
        "parameters": {
          "type": "object",
          "properties": {
            "count": {
              "type": "number",
              "description": "取得するニュースの件数（例: 3, 5, 10）"
            }
          },
          "required": ["count"]
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

    // 実際にニュース API を呼び出す（複数回の API 呼び出しを連鎖）
    console.log("\n--- 実際にニュースAPIを呼び出します ---");
    const newsItems = await getTechNews(functionArgs.count);

    console.log("\n取得したニュース:");
    newsItems.forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.title}`);
      console.log(`   URL: ${item.url}`);
      console.log(`   スコア: ${item.score} | 投稿者: ${item.author}`);
    });
  } else {
    console.log("ツールが呼び出されませんでした");
  }

}

// 実行
main();
