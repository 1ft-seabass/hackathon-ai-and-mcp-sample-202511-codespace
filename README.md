# ハッカソン向け ChatGPT API と MCP のサンプル集

> 2025年11月時点での田中正吾による、ハッカソンでザっと作れるようにするための説明用の資料とサンプル群です。

## このリポジトリについて

ChatGPT API を使った開発と、MCP (Model Context Protocol) を活用したエージェント構築のサンプルを集めたリポジトリです。

GitHub Codespaces 上で、すぐに動かして試せます。

## 教材サイト

詳しい学習ガイドは、以下の HonKit ドキュメントサイトを参照してください：

- https://1ft-seabass.github.io/hackathon-ai-and-mcp-sample-202511/

技術選択ガイド、各サンプルの詳しい説明、学習パスなどが記載されています。

## サンプル一覧

### 基礎編：ChatGPT API

- **02_api-basics**: ChatGPT API の基本的な使い方
- **03_function-calling**: Function Calling でツールを使う
- **04_conversational-basics**: 継続会話の基礎

### 応用編：対話型・サーバー実装

- **05_interactive-chat**: 標準入力での対話型アプリケーション
- **06_interactive-chat-server**: Web API サーバー実装

### MCP 編：Claude Desktop 連携

- **07_mcp-basics**: MCP の基本的な仕組み
- **08_mcp-api-wrapper**: MCP + 外部 API 連携

## はじめ方

### 1. Codespace を起動

このリポジトリページで：

1. 「Code」ボタンをクリック
2. 「Codespaces」タブを選択
3. 「Create codespace on main」をクリック

### 2. サンプルを選んで実行

各サンプルディレクトリに移動して実行します。

例：ChatGPT API の基本

```bash
cd 02_api-basics
npm install
node simple.js
```

### 3. API キーの設定

各サンプルファイルの先頭にある API キー設定箇所を、お使いの OpenAI API キーに書き換えてください。

```javascript
// OpenAI API キー
// お使いになる OpenAI API キーに差し替えましょう
const OPENAI_API_KEY = "OPENAI_API_KEY";
```

OpenAI API キーは [OpenAI Platform](https://platform.openai.com/api-keys) で取得できます。

## 詳しい学習方法

各サンプルの詳細な説明、技術選択のガイド、学習パスについては、HonKit ドキュメントサイトを参照してください：

https://1ft-seabass.github.io/hackathon-ai-and-mcp-sample-202511/

## ライセンス

MIT License
