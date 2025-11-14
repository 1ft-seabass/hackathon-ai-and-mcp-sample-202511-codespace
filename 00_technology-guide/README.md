# 技術選択ガイド

> このガイドは 2025 年 11 月時点での田中正吾の雑感として書いたものです。ハッカソンでザっと作れるようにするための説明用の資料とサンプル群として用意しました。技術選択は状況に応じて柔軟に判断してください。

このガイドでは、ChatGPT API を使った開発において「いつ、どの技術を使うといいか？」をお伝えします。

---

## このリポジトリで学べる技術

### ChatGPT API（基本）

何ができる？

- テキスト生成（チャット、文章作成）
- 画像認識（Vision API）
- 音声認識（Whisper API）
- 音声生成（TTS API）
- 画像生成（DALL-E API）

いつ使う？

- シンプルな会話機能が欲しい
- 画像を説明させたい
- 音声をテキストに変換したい

学習パス: `02_api-basics/`

---

### Function Calling

何ができる？

- AI が「ツール」を呼び出せるようになる
- 決まった形式のデータを取得できる
- 外部 API やデータベースと連携できる

いつ使う？

基本的な使い方:
- 天気予報を取得させたい
- データベースを検索させたい
- IoT デバイスを制御させたい

データ抽出（Structured Output として）:
- レシートから商品リストを抽出したい
- フォーム入力を構造化したい
- 確実に決まった形式でデータが欲しい

学習パス: `03_function-calling/`（Structured Output も含む）

補足:

ハッカソンでは**ワンショット実行**（1回のツール呼び出しで完結）が中心になります。複数ツールを連続実行する会話ループは実装が複雑なので、時間がない場合は避けた方が無難です。

---

### MCP（Model Context Protocol）

何ができる？

- 複数のツールを組み合わせた AI エージェントを作れる
- ツールを動的に追加・変更できる
- サーバレス環境でも動かせる

いつ使う？

- 複数のツールを使い分ける複雑なエージェントが欲しい
- `/api/message` のような API で AI エージェントを提供したい
- ツールを後から追加・変更したい
- API ラッパー型のエージェントシステムが必要な場合

学習パス:

- アーキテクチャ理解: `05_mcp-architecture/`
- 基礎: `06_mcp-standalone/`
- 本命: `07_mcp-api-wrapper/`
- サーバレス: `08_mcp-serverless/`

補足:

MCP は強力ですが、学習コストと実装コストが高いです。ハッカソンで使う場合は、既に慣れている人向けです。

---

## ハッカソンでの現実的な選択

何を作りたいかで決まります。

### シンプルなチャットや画像認識だけ

ChatGPT API (02_api-basics/)

### ツールを使わせたい（1〜3個程度）

Function Calling (03_function-calling/)

ハッカソンではこのパターンが多いです:
- 「天気教えて」→ 天気API → 応答
- 「ライトつけて」→ IoT API → 応答
- レシート画像 → データ抽出 → JSON

ツール実行なしで純粋にデータ抽出だけしたい場合は、Structured Output（`response_format` を使う方法）も検討できます。多くの場合、Function Calling で JSON を受け取って処理すれば十分です。

### 複雑なエージェント（上級者向け）

MCP（API ラッパー型）

- まず MCP の仕組みを理解したい: `05_mcp-architecture/` → `06_mcp-standalone/`
- すぐ使える実用的な例が欲しい: `07_mcp-api-wrapper/`
- サーバレス環境で動かしたい: `08_mcp-serverless/`

---

## Function Calling と Structured Output の関係

実は似ている:

両方とも「決まった形式で JSON を受け取る」という点では同じです。

違い:

| 技術 | 用途 | 実装 |
|------|------|------|
| Function Calling | ツール実行 + JSON 受け取り | `tools` パラメータ |
| Structured Output | ツール実行なし、データ抽出専用 | `response_format` パラメータ |

ハッカソンでの使い分け:

- **まず Function Calling を試す**: ツール実行 + JSON 受け取りができる
- **ツール実行が不要なら**: Structured Output も検討
- **多くの場合**: Function Calling で JSON 受け取って処理すれば十分

---

## Function Calling vs MCP

| 技術 | 実装コスト | 向いている場面 |
|------|-----------|---------------|
| Function Calling | 低 | ツールが少ない（1〜3個）、ハッカソン |
| MCP | 高 | ツールが多い、本格的なエージェント |

Function Calling:

- 実装が簡単、ツール定義がコード内で完結
- ハッカソンならこれで十分なケースが多い

MCP:

- ツールを動的に管理、複数クライアントで共有可能
- 実装コストは高いが、複雑なエージェントに適している
- API ラッパー型で実用的な API として提供できる

---

## よくある質問

### どの技術を選べばいい？

要件によります。ツールが少ない（1〜3個）なら Function Calling がシンプルです。ツールが多い、または将来的に増える予定なら MCP が適しています。

ハッカソンなら: まず Function Calling から始めるのがおすすめです。

### Function Calling で複数ツールを連続実行できる？

できますが、会話ループを自分で実装する必要があります:

1. API を呼ぶ
2. `tool_calls` があるかチェック
3. ツールを実行
4. 結果を `messages` に追加
5. また API を呼ぶ
6. 繰り返す

ハッカソンでは: 実装が複雑なので、ワンショット実行（1回で完結）がおすすめです。どうしても必要なら、Mastra などのフレームワークを検討してください。

### MCP の「API ラッパー型」って何？

`/api/message` のような API を作り、内部で AI エージェントが MCP ツールを使い分ける仕組みです。詳しくは `07_mcp-api-wrapper/` を参照してください。

---

## 次のステップ

初心者の方:

- `01_setup/` で環境構築
- `02_api-basics/` で基本を学ぶ
- `03_function-calling/` でツール実行を体験
- 必要に応じて MCP へ

ハッカソンで使いたい方:

- シンプルなツール実行: `03_function-calling/`
- 複雑なエージェント（上級者向け）: `07_mcp-api-wrapper/`

---

## 参考リンク

- OpenAI API ドキュメント
  - https://platform.openai.com/docs
- Function Calling ガイド
  - https://platform.openai.com/docs/guides/function-calling
- Structured Outputs ガイド
  - https://platform.openai.com/docs/guides/structured-outputs
- MCP 公式サイト
  - https://modelcontextprotocol.io/
