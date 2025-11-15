# 08. MCP API Wrapper - 外部 API を MCP でラップ

外部 API を MCP サーバーでラップして、AI から簡単に使えるようにする実用的なサンプル集です。

## 前提条件

- Node.js (v18 以上)
- TypeScript の基本知識
- `07_mcp-basics` の理解
- OpenAI API キー

## セットアップ

```bash
# 依存関係をインストール
cd 08_mcp-api-wrapper
npm install
```

### API キーの設定

OpenAI API キーを環境変数で設定するか、コード内に直接記述してください。

```bash
export OPENAI_API_KEY="your-api-key-here"
```

## サンプル一覧

### 1. 天気 API ラッパーサーバー

**ファイル**: `src/weather-server.ts`

無料の天気API（wttr.in）をラップするMCPサーバー。API キー不要で動作確認できます。

**サーバー単独起動**:
```bash
npm run server
```

**提供するツール**:
- `get_weather`: 指定された場所の天気情報を取得

### 2. 天気クライアント

**ファイル**: `src/weather-client.ts`

天気APIサーバーを使う対話型クライアント。

```bash
npm run client
```

**質問例**:
- 「東京の天気を教えて」
- 「ニューヨークは今何度？」
- 「ロンドンの天気はどう？」

終了するには `exit` または `Ctrl+C` を入力します。

### 開発モード（サーバーのファイル変更時に自動再起動）

```bash
npm run dev
```

## 学べること

### 外部 API の統合

1. **API 呼び出しの実装**
   ```typescript
   async function getWeather(location: string): Promise<string> {
     const url = `https://wttr.in/${encodeURIComponent(location)}?format=j1`;
     const response = await fetch(url);
     const data = await response.json();
     return JSON.stringify(data);
   }
   ```

2. **エラーハンドリング**
   ```typescript
   try {
     const weatherData = await getWeather(location);
     return { content: [{ type: "text", text: weatherData }] };
   } catch (error) {
     return {
       isError: true,
       content: [{ type: "text", text: `エラー: ${error.message}` }]
     };
   }
   ```

3. **データの加工と最適化**
   - 必要な情報だけを抽出
   - AIが理解しやすい形式に整形

### wttr.in API について

- **API キー不要**: 無料で使える天気API
- **JSON形式**: `?format=j1` でJSON形式を取得
- **公式ドキュメント**: https://github.com/chubin/wttr.in

**取得できる情報**:
- 現在の気温
- 天候（晴れ、曇り、雨など）
- 湿度
- 風速
- 体感温度

## ハッカソンでの活用パターン

### パターン 1: 既存 Web API をそのまま使う

**例**:
- 天気 API（wttr.in、OpenWeather など）
- ニュース API（NewsAPI など）
- 翻訳 API（DeepL、Google Translate など）
- データベース API（自作REST API など）

**実装方法**:
1. APIのエンドポイントとパラメータを確認
2. MCP サーバーでツールとして定義
3. `fetch` で API を呼び出し
4. レスポンスを整形して返す

### パターン 2: カスタム API を作る

**ハッカソンでの推奨構成**:
```
06_interactive-chat-server （HTTP API）
         ↓
08_mcp-api-wrapper （MCPサーバー）
         ↓
   Claude Desktop / Cline
```

**メリット**:
- 自分で作ったバックエンドAPIをAIから利用できる
- データベースやビジネスロジックを統合
- AIが使いやすいインターフェースを提供

### パターン 3: 複数 API を統合

**例**: 旅行プランナー
- 天気 API で目的地の天気を確認
- 翻訳 API で現地語に翻訳
- 地図 API で観光スポットを検索

**実装**:
```typescript
{
  name: "plan_trip",
  description: "旅行プランを作成します",
  // 複数のAPIを内部で呼び出す
}
```

## 07_mcp-basics との違い

### 07_mcp-basics
- シンプルな計算ツール（add, multiply, greet）
- 外部APIを呼び出さない
- MCPの基本構造を学ぶ

### 08_mcp-api-wrapper
- 実際の外部API（wttr.in）を呼び出し
- エラーハンドリングが必要
- ハッカソンでの実用的な例

## Claude Desktop / Cline との連携

### Claude Desktop の設定

`~/Library/Application Support/Claude/claude_desktop_config.json`（macOS）:

```json
{
  "mcpServers": {
    "weather": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/08_mcp-api-wrapper/src/weather-server.ts"]
    }
  }
}
```

### 環境変数を使う場合

```json
{
  "mcpServers": {
    "weather": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/08_mcp-api-wrapper/src/weather-server.ts"],
      "env": {
        "CUSTOM_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## トラブルシューティング

### API 呼び出しエラー

```
Error: 天気情報の取得に失敗しました
```

→ ネットワーク接続を確認してください。wttr.in が一時的にダウンしている可能性もあります。

### サーバー起動エラー

```
Cannot find module '@modelcontextprotocol/sdk'
```

→ `npm install` を実行してください。

### タイムアウトエラー

外部APIの呼び出しに時間がかかる場合があります。タイムアウト設定を追加することを検討してください。

## ハッカソンでの実装Tips

### 1. API キーの管理

環境変数を使う:
```typescript
const API_KEY = process.env.MY_API_KEY || "";
```

### 2. レスポンスのキャッシュ

同じ質問に対して毎回APIを呼ぶのは無駄:
```typescript
const cache = new Map();
if (cache.has(location)) {
  return cache.get(location);
}
```

### 3. レート制限の考慮

APIによっては呼び出し回数制限があります:
```typescript
// 簡易的な制限
let callCount = 0;
if (callCount > 100) {
  throw new Error("API呼び出し制限を超えました");
}
```

## 次のステップ

- [MCP Servers Repository](https://github.com/modelcontextprotocol/servers) - 公式サンプル集
- [wttr.in GitHub](https://github.com/chubin/wttr.in) - 天気API仕様
- 自分のハッカソンプロジェクトに合わせてカスタマイズ
