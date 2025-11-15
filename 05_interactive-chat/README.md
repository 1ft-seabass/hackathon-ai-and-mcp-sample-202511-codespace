# 05. Interactive Chat - 標準入力での対話型アプリ

継続会話 + 標準入力を組み合わせた、実際に使える対話型アプリケーションのサンプル集です。

## 前提条件

- Node.js (v18 以上)
- OpenAI API キー
- `04_conversational-basics` の理解

## セットアップ

```bash
# 依存関係をインストール
npm install
```

### API キーの設定

各サンプルファイルの先頭にある API キー設定箇所を、お使いの OpenAI API キーに書き換えてください。

```javascript
// OpenAI API キー
// お使いになる OpenAI API キーに差し替えましょう
const OPENAI_API_KEY = "ここにあなたのAPIキーを入力";
```

## サンプル一覧

### 1. 天気チャット

**ファイル**: `weather-interactive-chat.js`

標準入力で場所を聞き、Function Calling で天気 API を呼び出すシンプルな対話型アプリ。

```bash
node weather-interactive-chat.js
```

**特徴:**
- `readline` による標準入力の処理
- Function Calling と外部 API の連携
- 繰り返し質問できる対話ループ

**使い方:**
```
どの場所の天気を知りたいですか？ > Tokyo
（天気情報が表示される）

どの場所の天気を知りたいですか？ > Osaka
（天気情報が表示される）

どの場所の天気を知りたいですか？ > exit
```

### 2. メモチャット ⭐

**ファイル**: `memo-interactive-chat.js`

メモの追加・表示・削除を自然言語で行える対話型アプリ。**継続会話を活用した実践例**です。

```bash
node memo-interactive-chat.js
```

**特徴:**
- 継続会話による文脈の保持
- 複数の Tool（add_memo, list_memos, delete_memo）の使い分け
- ツール実行後の再問い合わせパターン
- メモリ内でのデータ保持

**使い方:**
```
あなた > 買い物リストを追加して
アシスタント: メモを追加しました。

あなた > 牛乳も追加
アシスタント: 追加しました。

あなた > メモを見せて
アシスタント: 1. 買い物リスト
            2. 牛乳

あなた > 1番目を削除
アシスタント: 削除しました。
```

## 重要な実装パターン

### 標準入力の処理（readline）

```javascript
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askUser = () => {
  rl.question("あなた > ", async (answer) => {
    // 入力を処理

    // 次の質問へ（再帰的に呼び出す）
    askUser();
  });
};

askUser(); // 開始
```

### 継続会話 + ツール実行

```javascript
const messages = [
  { role: "system", content: "システムメッセージ" }
];

// 1. ユーザー入力を履歴に追加
messages.push({ role: "user", content: userInput });

// 2. API 呼び出し
const completion = await openai.chat.completions.create({
  messages: messages,
  model: "gpt-4o",
  tools: tools,
  tool_choice: "auto"
});

// 3. ツール実行
if (completion.choices[0].message.tool_calls) {
  // アシスタントのメッセージを履歴に追加
  messages.push(completion.choices[0].message);

  // ツール実行結果を履歴に追加
  messages.push({
    role: "tool",
    tool_call_id: toolCall.id,
    content: result
  });

  // 4. 再度 API を呼び出して最終的な返答を得る
  const finalCompletion = await openai.chat.completions.create({
    messages: messages,
    model: "gpt-4o"
  });
}
```

## 04 との違い

| 項目 | 04_conversational-basics | 05_interactive-chat |
|------|-------------------------|---------------------|
| 入力 | ハードコード | 標準入力（readline） |
| 会話 | 3-5ターン固定 | ユーザーが終了するまで継続 |
| 目的 | 仕組みの理解 | 実用的なアプリケーション |
| ツール | なし | Function Calling を活用 |

## 学べること

- `readline` を使った標準入力の処理
- 対話ループの実装パターン
- 継続会話とツール実行の組み合わせ
- メッセージ履歴の実践的な管理
- エラーハンドリング

## 次のステップ

- [06. Interactive Chat Server](../06_interactive-chat-server/) - API サーバーとして実装
- [05. Prompt Caching](../05_prompt-caching/) - 長い会話を効率的に扱う
