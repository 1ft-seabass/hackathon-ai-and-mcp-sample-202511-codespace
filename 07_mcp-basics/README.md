# 07. MCP Basics - Model Context Protocol の基本

Model Context Protocol（MCP）を使ってツールを標準化・再利用するサンプル集です。

## 前提条件

- Node.js (v18 以上)
- TypeScript の基本知識
- これまでのサンプルの理解（特に 03_function-calling）
- OpenAI API キー

## セットアップ

```bash
# 依存関係をインストール
cd 07_mcp-basics
npm install
```

### API キーの設定

以下のいずれかの方法で OpenAI API キーを設定してください:

**方法1: 環境変数で設定（推奨）**
```bash
export OPENAI_API_KEY="your-api-key-here"
```

**方法2: ファイルに直接記述**
`src/execute-client.ts` と `src/interactive-client.ts` の先頭にある API キーを書き換えます。

## サンプル一覧

### 1. シンプルな MCP サーバー

**ファイル**: `src/simple-server.ts`

3つのツールを提供するMCPサーバーの実装例:
- `add`: 2つの数値を足し算
- `multiply`: 2つの数値を掛け算
- `greet`: 指定された名前で挨拶

**サーバー単独起動**:
```bash
npm run server
```

通常はクライアントから起動されるため、単独起動は動作確認用です。

### 2. 動作確認用クライアント（会話固定版）

**ファイル**: `src/execute-client.ts`

固定の質問（「5と3を足してください」）でMCPの動作を確認できます。

```bash
npm run execute
```

**動作フロー**:
1. MCP サーバーに接続
2. ツール一覧を取得
3. 固定の質問を ChatGPT API に送信
4. ChatGPT がツールを選択
5. MCP サーバーでツールを実行
6. 結果を表示

### 3. 対話型クライアント

**ファイル**: `src/interactive-client.ts`

自由に質問できる対話型クライアント。

```bash
npm run client
```

**質問例**:
- 「5と3を足して」
- 「10と7を掛けて」
- 「太郎さんに挨拶して」

終了するには `exit` または `Ctrl+C` を入力します。

### 開発モード（サーバーのファイル変更時に自動再起動）

```bash
npm run dev
```

## 学べること

### MCP の基本構造

1. **サーバー側**（`simple-server.ts`）
   - `Server` クラスでMCPサーバーを作成
   - `ListToolsRequestSchema` でツール一覧を返す
   - `CallToolRequestSchema` でツール実行を処理
   - `StdioServerTransport` で標準入出力通信

2. **クライアント側**（`execute-client.ts`, `interactive-client.ts`）
   - `Client` クラスでMCPクライアントを作成
   - `StdioClientTransport` でサーバーを起動・接続
   - `listTools()` でツール一覧を取得
   - `callTool()` でツールを実行

### Function Calling との違い

**Function Calling の場合**:
```typescript
// クライアントコードにツール定義を直接記述
const tools = [
  {
    type: "function",
    function: {
      name: "add",
      description: "2つの数値を足し算します",
      parameters: { /* スキーマ */ }
    }
  }
];
```

**MCP の場合**:
```typescript
// サーバーからツール定義を動的に取得
const toolsResult = await client.listTools();
// → サーバー側でツール定義が管理される
```

**メリット**:
- ツール定義をサーバー側で一元管理
- 同じサーバーを複数のクライアントから利用可能
- ツール変更時はサーバー側だけ修正すればよい

## MCP の仕組み

### 通信フロー

```
クライアント          サーバー
    |                   |
    |--- listTools ---->| ツール一覧を返す
    |<--- tools --------|
    |                   |
    |--- callTool ----->| ツールを実行
    |<--- result -------|
```

### ツール定義の構造

```typescript
{
  name: "add",              // ツール名
  description: "...",       // 説明
  inputSchema: {            // 入力スキーマ（JSON Schema形式）
    type: "object",
    properties: { ... },
    required: [ ... ]
  }
}
```

## Claude Desktop / Cline との連携

### Claude Desktop の設定

`~/Library/Application Support/Claude/claude_desktop_config.json`（macOS）:

```json
{
  "mcpServers": {
    "calculator": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/07_mcp-basics/src/simple-server.ts"]
    }
  }
}
```

### Cline（VSCode拡張）の設定

Cline の設定画面から MCP Servers セクションに同様の JSON を追加します。

## 06_interactive-chat-server との違い

### 06_interactive-chat-server
- Express でHTTP APIサーバーを実装
- REST API経由でアクセス（POST /message）
- ブラウザやPostmanから直接テスト可能
- 汎用的なWebアプリケーションに適用

### 07_mcp-basics
- MCP プロトコルでツールサーバーを実装
- 標準入出力（stdio）で通信
- Claude Desktop や Cline から直接利用
- AI エージェントとの統合に特化

**どちらを選ぶべきか**:
- **Webアプリ・API提供**: 06のHTTPサーバー
- **AIツール統合**: 07のMCPサーバー
- **両方作る**: 最も柔軟（ハッカソン推奨）

## トラブルシューティング

### API キーエラー

```
Error: Invalid API Key
```

→ 環境変数 `OPENAI_API_KEY` を設定するか、コード内のAPIキーを確認してください。

### サーバー起動エラー

```
Cannot find module '@modelcontextprotocol/sdk'
```

→ `npm install` を実行してください。

### ツールが実行されない

```
(ツールは呼び出されませんでした)
```

→ ChatGPT がツールを使う必要がないと判断しています。質問内容を具体的にしてください。

## 次のステップ

- [08. MCP API Wrapper](../08_mcp-api-wrapper/) - 外部 API を MCP でラップ
- [MCP 公式ドキュメント](https://modelcontextprotocol.io/) - プロトコル仕様
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) - SDK リファレンス
