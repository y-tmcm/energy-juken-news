# AIニュース

Xのタイムラインから24時間以内のAI関連ニュースを自動収集し、Geminiで分析してSlackに投稿するツールです。

```
┌──────────────────────────────────────────────────────────┐
│  🤖 24時間以内のAIトレンド                                │
│                                                          │
│  🔥 主要なニュース・話題                                  │
│  ──────────────────────────────                          │
│  GPT-5.5が発表、ネイティブtool useに対応                  │
│  - エージェント時代の到来を示す大型アップデート            │
│  - 複数のMCPサーバーを同時接続して自動実行が可能に        │
│                                                          │
│  ⚡️ 注目のアップデート                                    │
│  ──────────────────────────────                          │
│  Cursor Background Agent — 寝ている間にPRを作成           │
│  - コードレビューコメントまで自動付与                     │
│                                                          │
│  💡 技術トレンド                                          │
│  ──────────────────────────────                          │
│  テスト時計算量スケーリングへのパラダイムシフト            │
│  - より大きなモデルからよりスマートな推論へ               │
│                                                          │
│  AIニュースで自動生成                                     │
└──────────────────────────────────────────────────────────┘
```

Slackにはこのようなニュース分析レポートが毎朝届きます。

---

## 全体像

```
┌─────────────┐
│  トリガー     │  GitHub Actions
│  （いつ動く） │  → 毎朝 07:30 JST（定期実行を有効化した場合）
└──────┬──────┘
       ▼
┌─────────────┐
│  ソース元    │  X（旧Twitter）
│  （データ）  │  → ホームタイムラインから24時間以内のツイートを取得
└──────┬──────┘
       ▼
┌─────────────┐
│  処理する場所 │  GitHub Actions 上の Node.js
│  （加工）    │  → Gemini でトレンド分析し、構造化JSONに変換
└──────┬──────┘
       ▼
┌─────────────┐
│  届ける先    │  Slack
│  （配信）    │  → チャンネルにニュース分析レポートを投稿
└─────────────┘
```

---

## 料金について

| サービス | 料金 |
|---|---|
| GitHub Actions | 毎月2,000分無料（実行は数分で完了） |
| X API（pay-per-use） | Post Read $0.005/件。500件/日×30日 = **約$75/月**。100件/日なら約$15/月 |
| Jina Reader | 無料枠あり（1Mトークン、使い切り型） |
| Gemini（Flash + Pro） | 無料枠で完結（1日1回の実行なら超過しない） |
| Slack | 無料ワークスペースで可 |

X API 以外は全て無料枠で動きます。X API のコストを抑えたい場合は `src/settings.ts` の `maxTweets` を 100〜200 に下げてください。

> Jina Reader の無料1Mトークンは**アカウントに対する一括付与で、月次リセットされません**。枯渇してもツール自体は壊れず、ツイート本文だけで分析を続行します。

---

## セットアップ

### 準備するもの

- **GitHub アカウント**
- **Slack ワークスペース**（無料プランで可）
- **Google アカウント**（Gemini API キー取得用）
- **Jina AI アカウント**（無料登録）

> このツールは GitHub Actions が全自動で実行します。あなたの PC で `npm install` を実行する必要はありません。

### Part A: ツール本体を GitHub に置く

1. https://github.com/new にアクセス
2. **Repository name** に `ai-news` と入力
3. **Private** を選択（APIキーの設定を含むため、**必ず Private** にしてください）
4. 「Add a README file」のチェックは**外したまま**にする
5. 「Create repository」をクリック

Cursor で AI に以下のように依頼してください:

> 「このコードを GitHub にpushして。リポジトリは `あなたのユーザー名/ai-news` です」

### Part B: Slack App を作成する

1. https://api.slack.com/apps にアクセスし「Create New App」をクリック
2. 「From scratch」を選択し、アプリ名（例: AIニュース）とワークスペースを設定
3. 左メニュー「OAuth & Permissions」→ Bot Token Scopes に **`chat:write`** を追加
4. 「Install to Workspace」→ 許可する
5. 表示される **Bot User OAuth Token**（`xoxb-` で始まる）をコピー
6. レポートを投稿したいチャンネルにボットを追加（チャンネル設定 → インテグレーション → アプリを追加）
7. チャンネルの **チャンネルID** を確認（チャンネル名を右クリック → チャンネル詳細 → 最下部に表示）

GitHub Secrets に登録:
- `SLACK_BOT_TOKEN` — Bot User OAuth Token（`xoxb-...`）
- `SLACK_CHANNEL` — チャンネルID（`C...`）

### Part C: Gemini API キーを取得する

1. https://aistudio.google.com/apikey にアクセス
2. 「Create API Key」をクリック
3. 表示されたキーをコピー

GitHub Secrets に登録:
- `GEMINI_API_KEY` — コピーしたキー

> 無料枠で動きます。クレジットカードの登録は不要です。

### Part D: Jina API キーを取得する

1. https://jina.ai にアクセスし、アカウントを作成（またはログイン）
2. ダッシュボードで API キーを確認

GitHub Secrets に登録:
- `JINA_API_KEY` — コピーしたキー

> 無料枠（1Mトークン）で動きます。個人の学習・ニュース収集用途なら問題ありません。業務利用する場合は Paid プラン（jina.ai/pricing）への移行が必要です。

### Part E: モックルートで初回実行

X API の設定なしで動作確認できます。

1. リポジトリの「**Actions**」タブを開く
2. **左サイドバー**から「**Daily AI News**」をクリック
3. 「**Run workflow**」ボタンをクリック
4. **use_sample_data** にチェックを入れる
5. 緑の「**Run workflow**」ボタンをクリック

数分後、Slack にサンプルデータによる分析レポートが届きます。

> ここまでで「Gemini による分析 → Slack 投稿」の流れが確認できました。以降は本番の X 連携に進みます。

---

### Part F: X Developer アプリを作成する

**このツールで一番大変なステップです。** ここを越えれば、あとは動かすだけです。

#### 2026年の X API 料金体系

2026年2月以降、X API は **pay-per-use**（従量課金）型に移行しました。以前の月額 $200 の Basic プランは新規受付を停止しています。

- **初期費用なし**。クレジットカードを登録して、使った分だけ請求される仕組みです
- Post Read（ツイート取得）は 1件あたり $0.005

#### 手順

1. [console.x.com](https://console.x.com/) にアクセスし、自分の X アカウントでログイン
2. 開発者規約が表示されたら内容を確認して同意
3. 左メニューの「クレジット」→「クレジットを購入」で最低 $5 をチャージ
4. プロジェクト名を入力（例: `ai-news`）し、ユースケースを選択
5. アプリケーション名を入力（例: `ai-news-2026`。世界中で一意の名前が必要）

アプリ情報の入力例（Use case の Description）:

> Personal project to collect AI-related tweets from my timeline and summarize them using Gemini API. The summaries are posted to my private Slack workspace for personal news curation. Non-commercial, personal use only.

6. 左メニュー「アプリ」→ 作成したアプリを開き、**User authentication settings（ユーザー認証設定）** を入力:
   - **アプリの権限**: 「読む」を選択（タイムライン取得だけなので読み取り専用で十分）
   - **アプリの種類**: 「ウェブアプリ、自動化アプリまたはボット」を選択
   - **コールバックURI / リダイレクトURL（必須）**: `https://example.com`（このツールでは使わないが空にできない）
   - **ウェブサイトURL（必須）**: `https://example.com`
   - 「変更を保存する」をクリック

7. 「**キーとトークン**」タブを開く。このタブには4つのセクションが並んでいるが、**このツールで使うのは2つだけ**。

   ```
   ┌─ 使う（2つ）─────────────────────────────────────┐
   │ コンシューマーキー                                 │
   │   → API Key / API Key Secret                      │
   │ OAuth 1.0 キー                                    │
   │   → アクセストークン / アクセストークンシークレット  │
   └──────────────────────────────────────────────────┘
   ┌─ 使わない（触らなくてよい）─────────────────────────┐
   │ ベアラートークン                                   │
   │ OAuth 2.0 クライアントID・シークレット              │
   └──────────────────────────────────────────────────┘
   ```

   - **「コンシューマーキー」** セクションの「再生成」をクリック → **API Key** と **API Key Secret** を即メモ
   - **「OAuth 1.0 キー」** セクションの「アクセストークン」の「生成する」をクリック → **Access Token** と **Access Token Secret** を即メモ

> どちらも画面を閉じるとキーは二度と表示されません。必ず全4つをコピーしてから次に進んでください。

GitHub Secrets に登録:
- `X_CONSUMER_KEY` — 「コンシューマーキー」の API Key
- `X_CONSUMER_SECRET` — 「コンシューマーキー」の API Key Secret
- `X_ACCESS_TOKEN` — 「OAuth 1.0 キー」のアクセストークン
- `X_ACCESS_TOKEN_SECRET` — 「OAuth 1.0 キー」のアクセストークンシークレット

> 申請が通らない場合や時間がかかる場合は、Part E のモックルートで開発・カスタマイズを進めてください。X 連携は後からいつでも有効にできます。

### Part G: 本番ルートで実行

1. リポジトリの「**Actions**」タブを開く
2. 「**Daily AI News**」→「**Run workflow**」
3. **use_sample_data のチェックは外したまま**実行
4. Slack に自分のタイムラインからの本物のニュース分析が届く

### チェックポイント

- [ ] Slack に AI トレンド分析レポートが届いた
- [ ] レポートに自分がフォローしているアカウントの情報が含まれている

---

## 定期実行を有効にする

`.github/workflows/daily-news.yml` の `schedule` ブロック（2行）のコメントを外す:

変更前:
```yaml
  # schedule:
  #   - cron: '30 22 * * *'  # 毎日 07:30 JST
```

変更後:
```yaml
  schedule:
    - cron: '30 22 * * *'  # 毎日 07:30 JST
```

先頭のスペース（インデント）はそのまま残してください。時刻は UTC で指定します。

---

## テストで動作確認

ツールの核心ロジックが正しく動いているか、テストで確認できます。

```bash
npm test
```

全てのテストが通れば、ツールのロジックは正常です。

設定を変更した後（`src/settings.ts` や `src/analysis/prompts.ts` を編集した後）は、`npm test` を走らせて変更が壊れていないことを確認してください。

---

## カスタマイズ

設定は `src/settings.ts` に集約されています。

### レシピ 1: 分析カテゴリを変える

`src/analysis/schema.ts` の `tech_trends` を `design_trends` にリネームし、`src/analysis/prompts.ts` のプロンプトも合わせて変更すると、デザイン系トレンドの分析ツールになります。

### レシピ 2: 特定キーワードだけ分析する

`src/sources/x-timeline.ts` の取得後に以下のフィルタを挿入:

```ts
const filtered = tweets.filter(t => /GPT|Claude|Gemini/i.test(t.text));
```

### レシピ 3: 複数チャンネルに分けて投稿

`src/delivery/slack.ts` で `main_news` は `#ai-news`、`tech_trends` は `#ai-tech` のように section ごとにチャンネルを分けられます。

---

## 応用例

4パーツの一部を差し替えると、まったく別のツールになります。

- **ソース元を RSS に差し替える** → 毎朝のニュース要約ツール
- **処理を感情分析に差し替える** → 競合の口コミ見張り番
- **届ける先を Notion に差し替える** → 毎朝の社内ニュースDB

---

## セキュリティ

- **リポジトリは Private に**: API キーを GitHub Secrets に保存しているため、公開リポジトリにしないでください
- **Slack Bot Token**: Bot Token Scopes は `chat:write` のみに制限してください
- **トークンが漏洩した場合**:
  - X: console.x.com → アプリ → キーとトークン → 該当セクションの「再生成」で即時失効
  - Gemini: aistudio.google.com でキーを削除して再発行
  - Slack: api.slack.com でトークンをローテーション

---

## 困ったとき

1. **まず AI に聞く**: Cursor で「セットアップで〇〇のエラーが出ました」と伝えてください
2. **GitHub Actions のログを確認**: Actions タブ → 失敗したジョブ → `[USER-FACING]` の行を読む
3. **エラー別の対処法**: [docs/troubleshooting.md](docs/troubleshooting.md) に主要なエラーと対処法をまとめています
4. **Slack で相談**: ADS Slack の質問チャンネルに投稿してください

---

## 技術スタック

| 項目 | 選定 | 理由 |
|---|---|---|
| 実行基盤 | GitHub Actions | 無料枠で十分、セットアップが簡単 |
| 言語 | TypeScript（Node.js 22） | X API公式SDKがTS対応、型安全 |
| X API | twitter-api-v2 | OAuth 1.0a対応のデファクト |
| URL本文取得 | Jina Reader | LLM最適化されたMarkdown化 |
| AI（URL要約） | Gemini 2.5 Flash | 大量処理に適した軽量モデル |
| AI（最終分析） | Gemini 2.5 Pro | 高品質な構造化出力 |
| 通知 | Slack API（Block Kit） | 構造化された見やすいレポート |
