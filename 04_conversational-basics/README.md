# 04. Conversational Basics - 継続会話の基礎

ワンショット（1回の質問・回答）から継続会話（複数ターン）へステップアップするためのサンプル集です。

## 前提条件

- Node.js (v18 以上)
- OpenAI API キー
- `02_api-basics` と `03_function-calling` の理解

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

### 1. シンプルな継続会話

**ファイル**: `simple-conversation.js`

最もシンプルな継続会話の実装例。3ターンの会話を通じて、メッセージ履歴の管理方法を学びます。

```bash
node simple-conversation.js
```

**学べること:**
- `messages` 配列による会話履歴の管理
- ユーザーとアシスタント両方のメッセージを保存する重要性
- 過去の文脈を参照した会話の実現

### 2. 文脈を保持した会話

**ファイル**: `conversation-with-context.js`

実践的な会話シナリオ（レストラン予約）を通じて、文脈を保持した自然な対話を実装します。

```bash
node conversation-with-context.js
```

**学べること:**
- システムメッセージによる役割設定
- 会話関数の抽象化（再利用可能なパターン）
- 複数ターンにわたる情報の蓄積と参照
- トークン数の増加に対する注意点

## 重要な概念

### メッセージ履歴の管理

継続会話を実現するには、**会話の履歴全体を保持し、毎回 API に送信する**必要があります。

```javascript
const messages = [];

// ユーザーの発言を追加
messages.push({ role: "user", content: "こんにちは" });

// API に履歴全体を送信
const completion = await openai.chat.completions.create({
  messages: messages,  // ← 履歴全体
  model: "gpt-4o-mini"
});

// アシスタントの返答も履歴に追加（重要！）
messages.push({
  role: "assistant",
  content: completion.choices[0].message.content
});
```

### メッセージの役割（role）

- `system`: AI の振る舞いや役割を定義
- `user`: ユーザーの発言
- `assistant`: AI の返答

### トークン数への配慮

会話が長くなるほど、毎回送信するトークン数が増加します。長い会話では以下の対策が必要になります：

- 古いメッセージの削除
- 会話の要約
- Prompt Caching の活用（05 で学びます）

## ワンショットとの違い

### 02_api-basics（ワンショット）
```javascript
// 毎回新しい会話
const completion = await openai.chat.completions.create({
  messages: [
    { role: "user", content: "質問" }  // ← 1回きり
  ],
  model: "gpt-4o-mini"
});
```

### 04_conversational-basics（継続会話）
```javascript
// 履歴を保持
const messages = [];
messages.push({ role: "user", content: "1回目の質問" });
// ... API 呼び出し、返答を messages に追加 ...

messages.push({ role: "user", content: "2回目の質問" });
// ... API 呼び出し（履歴全体を送る） ...
```

## 次のステップ

- [05. Interactive Chat](../05_interactive-chat/) - 標準入力を使った対話型アプリケーション
- [05. Prompt Caching](../05_prompt-caching/) - 長い会話を効率的に扱う
