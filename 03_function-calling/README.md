# 03. Function Calling - AI にツールを使わせる

Function Calling（Tool Use）を使って、AI に外部ツールや関数を実行させるサンプル集です。

## 前提条件

- Node.js (v18 以上)
- OpenAI API キー
- `02_api-basics` の理解

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

### 1. ライト ON/OFF 制御

**ファイル**: `light-control.js`

最もシンプルな Function Calling の例。「ライトをつけて」「ライトを消して」といった自然言語を、`on_command` / `off_command` に変換します。

```bash
node light-control.js
```

IoT デバイス制御のイメージで学べます。

### 2. 色名 → RGB 変換

**ファイル**: `color-converter.js`

やや複雑な Function Calling の例。色名（例: "赤"）を RGB 値に変換します。成功/失敗で異なるツールを使い分けます。

```bash
node color-converter.js
```

構造化されたデータ抽出のパターンが学べます。

### 3. 天気 API 連携 ⭐

**ファイル**: `weather-api.js`

**実践的な Function Calling の例。** AI がツールを選択し、**実際に外部 API（wttr.in）を呼び出して**天気情報を取得します。

```bash
node weather-api.js
```

**ハッカソンで最も重要なパターン:**
- AI → ツール選択 → **実際の API 呼び出し** → データ整形
- 無料 API（wttr.in）を使用、API キー不要
- ハッカソンでの典型的な実装フロー

### 4. ニュース API 連携（複数 API 呼び出し）⭐

**ファイル**: `news-api.js`

**より実践的な例。** Hacker News API から最新のテックニュースを取得します。**複数回の API 呼び出しを連鎖**させるパターンが学べます。

```bash
node news-api.js
```

**学べるパターン:**
- トップストーリー ID リスト取得 → 各記事の詳細取得（**API 呼び出しの連鎖**）
- 無料 API（Hacker News）を使用、API キー不要
- ループ処理でのデータ整形

## 学べること

- Function Calling の基本的な仕組み
- ツール定義（`tools` パラメータ）の書き方
- AI がツールを選択する仕組み（`tool_choice: "auto"`）
- ツール実行結果（`tool_calls`）の取得方法
- 複数ツールの使い分け
- **外部 API との実践的な連携**（weather-api.js, news-api.js）
- **複数 API 呼び出しの連鎖**（news-api.js）

## 次のステップ

- [04. Prompt Caching](../04_prompt-caching/) - 大量のツール定義を効率的に扱う
- [06. MCP Basics](../06_mcp-basics/) - ツールを標準化して再利用する
