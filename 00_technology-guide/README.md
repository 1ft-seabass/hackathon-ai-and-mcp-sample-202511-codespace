# 技術選択ガイド

このガイドでは、ChatGPT API を使った開発において「いつ、どの技術を使うべきか」を説明します。

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

- 天気予報を取得させたい
- データベースを検索させたい
- IoT デバイスを制御させたい
- ツール定義が固定で OK な場合

学習パス: `03_function-calling/`

---

### Structured Output

何ができる？

- AI の出力を決まった JSON 形式で受け取れる
- フォーム入力のパースに使える
- データ抽出が確実にできる

いつ使う？

- レシートから商品リストを抽出したい
- フォーム入力を構造化したい
- 確実に決まった形式でデータが欲しい

学習パス: `04_structured-output/`

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
- 封じ込め型のエージェントシステムが必要な場合

学習パス:

- アーキテクチャ理解: `05_mcp-architecture/`
- 基礎: `06_mcp-standalone/`
- 本命: `07_mcp-封じ込め型/`
- サーバレス: `08_mcp-serverless/`

---

## どれを選ぶか

何を作りたいかで決まります。

シンプルなチャットや画像認識だけ

- ChatGPT API (02_api-basics/)

決まったツール（1〜3個）を使わせたい

- ツールを実行させたい
  - Function Calling (03_function-calling/)
- 決まった形式でデータが欲しい
  - Structured Output (04_structured-output/)

複数ツールを組み合わせた複雑なエージェント

- まず MCP の仕組みを理解したい
  - 05_mcp-architecture/ → 06_mcp-standalone/
- すぐ使える実用的な例が欲しい
  - 07_mcp-封じ込め型/
- サーバレス環境で動かしたい
  - 08_mcp-serverless/

---

## Function Calling vs Structured Output vs MCP

| 技術 | 実装コスト | 柔軟性 | 使い所 |
|------|-----------|--------|--------|
| Function Calling | 低 | 中 | ツール実行が目的 |
| Structured Output | 低 | 低 | データ抽出が目的 |
| MCP | 高 | 高 | 複雑なエージェント |

Function Calling:

- 実装が簡単、ツール定義がコード内で完結
- ツールを動的に追加できない
- 単一アプリで決まったツールを使う場合に向いている

Structured Output:

- 確実に決まった形式でデータが返る
- ツール実行はできない（データ抽出専用）
- フォームパース、データ抽出に向いている

MCP:

- ツールを動的に管理、複数クライアントで共有可能
- 実装が複雑、封じ込め型まで作らないと実用的でない
- 複雑なエージェント、サーバレス環境に向いている

---

## よくある質問

「とりあえず MCP 使えばいいんじゃない？」

いや、そうでもない。MCP は強力だけど、封じ込め型まで実装しないと実用的じゃないです。Function Calling で十分なケースが多い。

Function Calling と Structured Output の違いは？

- Function Calling: ツールを「実行」させる
- Structured Output: データを「抽出」させる

目的が違います。

MCP の「封じ込め型」って何？

`/api/message` のような API を作り、内部で AI エージェントが MCP ツールを使い分ける仕組みです。詳しくは `07_mcp-封じ込め型/` を参照。

---

## 次のステップ

初心者の方

- `01_setup/` で環境構築
- `02_api-basics/` で基本を学ぶ
- `03_function-calling/` でツール実行を体験
- 必要に応じて MCP へ

すぐ使いたい方

- Function Calling で十分なら: `03_function-calling/`
- 複雑なエージェントが必要なら: `07_mcp-封じ込め型/`

詳細な判断基準は [when-to-use-what.md](./when-to-use-what.md) を参照してください。

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
