# 02. API Basics - OpenAI ChatGPT API の基本

OpenAI ChatGPT API の基本的な使い方を学ぶサンプル集です。

## 前提条件

- Node.js (v18 以上)
- OpenAI API キー

## セットアップ

```bash
# 依存関係をインストール
npm install
```

### API キーの設定

サンプルファイル（`simple.js`）の先頭にある API キー設定箇所を、お使いの OpenAI API キーに書き換えてください。

```javascript
// OpenAI API キー
// お使いになる OpenAI API キーに差し替えましょう
const OPENAI_API_KEY = "ここにあなたのAPIキーを入力";
```

## サンプル

**ファイル**: `simple.js`

最も基本的な API 呼び出しの例。

```bash
node simple.js
```

## 学べること

- OpenAI SDK の初期化
- Chat Completions API の基本的な使い方

## 次のステップ

- [03. Function Calling](../03_function-calling/) - ツールを使った AI との連携
- [04. Prompt Caching](../04_prompt-caching/) - コストと速度の最適化
