# いつ何を使うべきか - 詳細ガイド

このドキュメントでは、具体的なユースケースごとに「どの技術を選ぶべきか」を詳しく説明します。

## ユースケース別の技術選択

### シンプルなチャットボット

要件:
- ユーザーと会話するだけ
- 外部データは不要

推奨技術: ChatGPT API（基本）

理由:
- 追加の仕組みは不要
- シンプルで保守しやすい

サンプル: `02_api-basics/01_simple-chat.ts`

---

### 画像を説明させる

要件:
- アップロードされた画像を説明
- 画像の内容を文章で返す

推奨技術: ChatGPT API（Vision）

理由:
- Vision API で十分
- Function Calling は不要

サンプル: `02_api-basics/02_image-recognition.ts`

---

### 天気予報を答えるチャットボット

要件:
- 「今日の東京の天気は？」と聞かれたら天気 API を呼ぶ
- 結果を自然な文章で返す

推奨技術: Function Calling

理由:
- 天気 API という「ツール」を実行させる
- ツールは固定（天気APIのみ）
- MCP は過剰

サンプル: `03_function-calling/01_simple-example.ts`

よくある間違い:
- MCP を使う → 実装が複雑すぎる
- 文字列パースで対応 → AI が正確に API を呼べない

---

### レシートから商品リストを抽出

要件:
- レシート画像をアップロード
- 商品名、価格、数量を JSON で取得

推奨技術: Structured Output + Vision

理由:
- データ抽出が目的（ツール実行ではない）
- 確実に決まった形式で返ってほしい

サンプル: `04_structured-output/04_image-with-structured.ts`

よくある間違い:
- Function Calling を使う → データ抽出には向かない
- 通常の ChatGPT API → JSON 形式が保証されない

---

### IoT デバイスを音声で制御

要件:
- 「ライトをつけて」と言われたらデバイスを操作
- 音声認識 + デバイス制御

推奨技術: Whisper API + Function Calling

理由:
- 音声認識（Whisper）でテキスト化
- Function Calling でデバイス制御
- ツールは固定（デバイス制御APIのみ）

サンプル:
- `02_api-basics/03_speech-to-text.ts`
- `03_function-calling/05_speech-with-function.ts`

---

### 複数ツールを使い分けるエージェント

要件:
- 天気、ニュース、カレンダー、メール送信など複数のツールを使う
- ユーザーの質問に応じて適切なツールを選ぶ
- API 経由で提供したい（`/api/message`）

推奨技術: MCP（封じ込め型）

理由:
- 複数ツールを動的に管理できる
- 封じ込め型で API として提供可能
- Function Calling では管理が煩雑

サンプル: `07_mcp-封じ込め型/`

なぜ Function Calling ではダメ？

- ツールが増えるとコードが肥大化
- ツールの追加・変更が大変
- クライアントごとにツール定義を書き直す必要がある

---

### サーバレス環境で AI エージェント

要件:
- AWS Lambda などで AI エージェントを動かす
- リクエストごとに起動・終了
- 複数のツールを使う

推奨技術: MCP（サーバレス対応）

理由:
- MCP は stdio 通信で軽量に動作
- サーバレス環境に適している
- 封じ込め型をベースに Lambda 対応

サンプル: `08_mcp-serverless/`

---

## トレードオフ

実装コスト

低コスト:
- ChatGPT API（基本） - 数行で動く
- Structured Output - スキーマ定義だけ追加
- Function Calling - ツール定義を追加

高コスト:
- MCP（単体） - サーバー + クライアントが必要
- MCP（封じ込め型） - API サーバー + MCP 統合が必要

柔軟性

低い:
- Structured Output: データ抽出専用

中程度:
- Function Calling: ツール固定

高い:
- MCP: ツールを動的に管理可能

保守性

高い:
- ChatGPT API（基本）: シンプルなコード
- Function Calling: ツール定義がコード内で完結
- Structured Output: スキーマがドキュメントになる

中程度:
- MCP: サーバーとクライアントの分離が必要

---

## よくある間違い

「とりあえず MCP 使っとけ」

問題:
- MCP は実装コストが高い
- 封じ込め型まで作らないと実用的でない
- Function Calling で十分なケースが多い

正解:
- まず Function Calling で試す
- 複雑になってきたら MCP を検討

---

Function Calling でデータ抽出

問題:
- Function Calling はツール実行が目的
- データ抽出には Structured Output が適している

例:

```typescript
// × Function Calling でデータ抽出（不適切）
tools: [{
  name: "extract_receipt",
  description: "レシートからデータを抽出",
  parameters: { /* スキーマ */ }
}]

// ○ Structured Output でデータ抽出（適切）
response_format: {
  type: "json_schema",
  json_schema: { /* スキーマ */ }
}
```

---

Structured Output でツール実行

問題:
- Structured Output はデータ形式を指定するだけ
- 実際のツール実行はできない

正解:
- ツール実行には Function Calling を使う

---

MCP の単体実装だけで終わる

問題:
- MCP サーバー + クライアントだけでは使いにくい
- 実用には封じ込め型が必要

正解:
- 学習: `06_mcp-standalone/` で仕組みを理解
- 実用: `07_mcp-封じ込め型/` で API 化

---

## ケーススタディ

### カスタマーサポートボット

要件:
- FAQ 検索
- 注文状況確認
- 問い合わせチケット作成

技術選択: MCP（封じ込め型）

理由:
- 3つのツールを使い分ける
- API として提供（`/api/support`）
- 将来的にツールを追加する可能性あり

実装パス:
- `05_mcp-architecture/` でアーキテクチャ理解
- `07_mcp-封じ込め型/` を参考に実装
- FAQ、注文、チケットの各 MCP ツールを作成

---

### レシート管理アプリ

要件:
- レシート画像をアップロード
- 商品リストを抽出して DB に保存

技術選択: Structured Output + Vision

理由:
- データ抽出が主目的
- ツール実行は不要（DB 保存はアプリ側で実施）

実装パス:
- `02_api-basics/02_image-recognition.ts` で Vision API を理解
- `04_structured-output/04_image-with-structured.ts` で実装

---

## 判断のポイント

シンプルから始める

- まず ChatGPT API（基本）で動かす
- 必要に応じて Function Calling を追加
- データ抽出には Structured Output
- 複雑になってきたら MCP を検討

MCP は「最後の手段」ではない

- 複雑なエージェントには最適
- ただし実装コストを理解した上で選択
- 封じ込め型まで作ることを前提に

技術選択の鉄則

- 過剰な技術を使わない
- 要件に合った最小限の技術を選ぶ
- 将来の拡張性も考慮する

---

## 次のステップ

技術を選んだら、対応するセクションで実装を学びましょう：

- `02_api-basics/` - ChatGPT API の基本
- `03_function-calling/` - ツール実行
- `04_structured-output/` - データ抽出
- `07_mcp-封じ込め型/` - 複雑なエージェント
