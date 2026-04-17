# AIニュース

Xのホームタイムラインから24時間以内のAI関連ニュースを収集し、Geminiで分析してSlackに投稿する自動配信ツール。

## プロジェクト構造

```
src/
├── main.ts              # エントリポイント（最初にここを読む）
├── settings.ts          # 受講生が触る全設定（TS定数）
├── config.ts            # 環境変数の zod 検証
├── types.ts             # 共通型定義
├── sources/
│   ├── x-timeline.ts    # X API タイムライン取得 + モックルート分岐
│   └── url-content.ts   # Jina Reader で URL 本文並列取得
├── analysis/
│   ├── url-summarizer.ts # Gemini Flash で各URL要約
│   ├── analyze.ts       # Gemini Pro で最終トレンド分析
│   ├── schema.ts        # zod スキーマ（SSoT）
│   └── prompts.ts       # プロンプト2つ
├── delivery/
│   └── slack.ts         # Block Kit 組み立て + Slack投稿
└── utils/
    ├── chunk.ts         # 配列チャンク分割
    ├── errors.ts        # UserFacingError + assertSlackOk
    └── post-optimizer.ts # URL抽出・t.co展開・テキスト整形
```

## 実行方法

```bash
npm start                     # 通常実行
USE_SAMPLE_DATA=true npm start # モックルート（X API 不要）
```

## 読む順番

1. `src/main.ts` — 4ステップの全体像
2. `src/sources/x-timeline.ts` — ソース元
3. `src/analysis/analyze.ts` — 処理
4. `src/delivery/slack.ts` — 届ける先
5. `src/settings.ts` — 設定を変えたいとき

## GitHub Secrets

| シークレット名 | 用途 |
|---|---|
| `X_CONSUMER_KEY` | X OAuth 1.0a consumer key（console.x.com 「コンシューマーキー」の API Key） |
| `X_CONSUMER_SECRET` | X OAuth 1.0a consumer secret（同 API Key Secret） |
| `X_ACCESS_TOKEN` | X OAuth 1.0a access token（console.x.com 「OAuth 1.0 キー」のアクセストークン） |
| `X_ACCESS_TOKEN_SECRET` | X OAuth 1.0a access token secret（同 アクセストークンシークレット） |
| `JINA_API_KEY` | Jina Reader |
| `GEMINI_API_KEY` | Gemini Flash + Pro |
| `SLACK_BOT_TOKEN` | Slack Bot（`chat:write` スコープ） |
| `SLACK_CHANNEL` | 投稿先チャンネルID |

## 禁止事項

- curl で直接 Slack API / X API を叩かない
- `src/settings.ts` 以外のファイルで設定値をハードコードしない
- 受講生に見せたいエラー文言は `UserFacingError` の `message` に入れる（`main.ts` が `[USER-FACING]` プレフィックス付きで出力する）。`throw new Error(...)` だけだと `[INTERNAL]` 扱いになり、受講生が混乱する
