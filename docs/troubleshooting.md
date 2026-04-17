# 困ったとき

## GitHub Actions のログの読み方

1. リポジトリの **Actions** タブを開く
2. 実行したワークフローをクリック
3. **run** ジョブをクリックして各ステップを展開
4. `[USER-FACING]` で始まる行を最優先で読む — 次に何をすべきかが書いてある
5. `[INTERNAL]` で始まる行は開発者向けの詳細情報

---

## エラー別の対処法

### X API

| 症状 | 原因 | 対処 |
|---|---|---|
| `401 Unauthorized` | 4つのキーのいずれかが間違っているか期限切れ | console.x.com → アプリ → キーとトークン → 「OAuth 1.0 キー」のアクセストークンを再生成し、GitHub Secrets を更新 |
| `429 Too Many Requests` | レート制限に到達 | 15分待機してから再実行。`src/settings.ts` の `maxTweets` を下げる |
| X API が使えない / 申請が通らない | pay-per-use の Billing 未設定、または申請待ち | X Developer Portal → Billing → Add payment method。申請中は `USE_SAMPLE_DATA=true` のモックルートで動作確認 |

### Jina Reader

| 症状 | 原因 | 対処 |
|---|---|---|
| `402 Payment Required` | 1Mトークンの無料枠が枯渇 | **自動フォールバック済み**のため配布物は壊れない。長期利用なら Paid プラン (jina.ai/pricing) へ、または `src/settings.ts` の `urlContent.enabled` を `false` に |

### Gemini

| 症状 | 原因 | 対処 |
|---|---|---|
| `400 API key not valid` | APIキーの誤り | aistudio.google.com で再発行し、GitHub Secrets の `GEMINI_API_KEY` を更新 |
| `429 Resource exhausted` | Free枠の1日上限超過（Flash 250/day, Pro 100/day） | 明日まで待つ。手動実行は1日1〜2回に抑える |
| `SAFETY filter` | ツイート内容がセーフティフィルタに抵触 | `maxTweets` を減らす。タイムラインのフォロー先を見直す |

### Slack

| 症状 | 原因 | 対処 |
|---|---|---|
| `channel_not_found` | `SLACK_CHANNEL` のIDが間違っている | Slackでチャンネルを右クリック → チャンネル詳細 → 最下部のID（`C`で始まる文字列）をコピーし直す |
| `not_in_channel` | BotアプリがチャンネルにいないBot | チャンネルで `/invite @あなたのBot名` を実行 |
| `not_authed` / `invalid_auth` | `SLACK_BOT_TOKEN` が間違っているか期限切れ | api.slack.com → アプリ → OAuth & Permissions → Bot User OAuth Token を再コピー |

### その他

| 症状 | 原因 | 対処 |
|---|---|---|
| 成功扱い（緑）だが Slack に投稿がない | `maxTweets: 0` や `lookbackHours: 0` の誤設定 | `src/settings.ts` の値を確認 |
| Actions がずっと黄色（実行中） | Jina Reader の大量タイムアウト | `src/settings.ts` の `urlContent.parallelism` を `5` に下げる、または `urlContent.enabled` を `false` にして再実行 |
