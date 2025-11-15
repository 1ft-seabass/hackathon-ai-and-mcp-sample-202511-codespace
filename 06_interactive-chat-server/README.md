# 06. Interactive Chat Server - API サーバー化

標準入力の対話型アプリを Web API サーバーとして実装したサンプル集です。

## 前提条件

- Node.js (v18 以上)
- OpenAI API キー
- `05_interactive-chat` の理解

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

### 1. 天気チャットサーバー

**ファイル**: `weather-interactive-chat-server.js`

05 の weather-interactive-chat.js を Web API サーバー化したもの。

```bash
node weather-interactive-chat-server.js
```

**エンドポイント:**
- `POST /message` - メッセージを送信（会話継続）
- `POST /clear` - 会話履歴をクリア
- `GET /` - サーバー情報取得

**使い方（別のターミナルで）:**
```bash
# メッセージ送信
curl -X POST http://localhost:3000/message \
  -H "Content-Type: application/json" \
  -d '{"message":"東京の天気を教えて"}'

# 履歴クリア
curl -X POST http://localhost:3000/clear

# サーバー情報
curl http://localhost:3000/
```

### 2. メモチャットサーバー ⭐

**ファイル**: `memo-interactive-chat-server.js`

05 の memo-interactive-chat.js を Web API サーバー化したもの。**継続会話 + ツール + サーバー化の完全実装例**です。

```bash
node memo-interactive-chat-server.js
```

**エンドポイント:**
- `POST /message` - メッセージを送信（会話継続）
- `POST /clear` - 会話履歴をクリア（メモは保持）
- `GET /` - サーバー情報とメモ一覧取得

**使い方（別のターミナルで）:**
```bash
# メモを追加
curl -X POST http://localhost:3001/message \
  -H "Content-Type: application/json" \
  -d '{"message":"買い物リストを追加"}'

# さらに追加（会話が継続されている）
curl -X POST http://localhost:3001/message \
  -H "Content-Type: application/json" \
  -d '{"message":"牛乳も追加"}'

# メモを表示
curl -X POST http://localhost:3001/message \
  -H "Content-Type: application/json" \
  -d '{"message":"メモを見せて"}'

# 会話履歴クリア（メモは残る）
curl -X POST http://localhost:3001/clear

# サーバー情報（メモ一覧も表示）
curl http://localhost:3001/
```

## 重要な実装パターン

### Express サーバーの基本

```javascript
const express = require("express");
const app = express();
app.use(express.json()); // JSON 解析

// エンドポイント定義
app.post("/message", async (req, res) => {
  const { message } = req.body;
  // 処理...
  res.json({ response: "..." });
});

// サーバー起動
app.listen(3000, () => {
  console.log("サーバー起動");
});
```

### 会話履歴の保持

```javascript
// サーバー起動中はメモリに保持
let messages = [];

app.post("/message", async (req, res) => {
  // ユーザーメッセージを履歴に追加
  messages.push({ role: "user", content: req.body.message });

  // API 呼び出し（履歴全体を送る）
  const completion = await openai.chat.completions.create({
    messages: messages,
    model: "gpt-4o"
  });

  // 返答も履歴に追加
  messages.push({
    role: "assistant",
    content: completion.choices[0].message.content
  });
});
```

### ツール実行フロー（サーバー版）

```javascript
app.post("/message", async (req, res) => {
  // 1. ユーザーメッセージを履歴に追加
  messages.push({ role: "user", content: req.body.message });

  // 2. API 呼び出し
  const completion = await openai.chat.completions.create({
    messages: messages,
    model: "gpt-4o",
    tools: tools,
    tool_choice: "auto"
  });

  // 3. ツール実行がある場合
  if (completion.choices[0].message.tool_calls) {
    messages.push(completion.choices[0].message);

    for (const toolCall of completion.choices[0].message.tool_calls) {
      const result = executeTool(toolCall.function.name, ...);
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result
      });
    }

    // 4. 再度 API 呼び出し
    const finalCompletion = await openai.chat.completions.create({
      messages: messages,
      model: "gpt-4o"
    });

    messages.push({
      role: "assistant",
      content: finalCompletion.choices[0].message.content
    });
  }

  // 5. レスポンス返却
  res.json({ response: "..." });
});
```

## 05 との違い

| 項目 | 05_interactive-chat | 06_interactive-chat-server |
|------|---------------------|---------------------------|
| インターフェース | 標準入力（readline） | HTTP API（Express） |
| 実行方法 | ターミナルで対話 | curl/Postman でリクエスト |
| 会話管理 | ローカル変数 | サーバーメモリ（本番は DB） |
| 用途 | CLI ツール | Web アプリのバックエンド |

## 注意点

### 本番環境への展開時の考慮事項

現在の実装はシンプルな学習用です。本番環境では以下の対応が必要です：

1. **会話履歴の永続化**
   - Redis, MongoDB などに保存
   - ユーザーごとにセッション管理

2. **認証・認可**
   - API キー、JWT などで保護

3. **エラーハンドリング**
   - リトライ処理
   - タイムアウト対策

4. **レート制限**
   - 過度なリクエストを防止

5. **ログとモニタリング**
   - アクセスログ
   - エラー追跡

## 学べること

- Express を使った Web サーバーの基本
- REST API の設計
- 継続会話をサーバー環境で実装する方法
- 状態管理（会話履歴、メモデータ）
- HTTP エンドポイントの設計パターン

## 次のステップ

- [07. Prompt Caching](../07_prompt-caching/) - 長い会話を効率的に扱う（サーバー環境で重要）
- [08. MCP Basics](../08_mcp-basics/) - ツールを標準化して再利用する
