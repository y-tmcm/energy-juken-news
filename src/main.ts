// ┌──────────────────────────────────────────────────────┐
// │  読み順ガイド                                        │
// │  この main() の4ステップを上から読めば全体が分かる。  │
// │  詳しく見たくなったら各 import 先にジャンプ。          │
// │  設定を変えたい場合は src/settings.ts を開く。        │
// └──────────────────────────────────────────────────────┘

import { loadConfig } from "./config.js";
import { settings } from "./settings.js";
import { fetchHomeTimeline } from "./sources/x-timeline.js";
import { fetchUrlContents } from "./sources/url-content.js";
import { summarizeUrls } from "./analysis/url-summarizer.js";
import { analyzeTrends } from "./analysis/analyze.js";
import { postToSlack } from "./delivery/slack.js";
import { UserFacingError } from "./utils/errors.js";

const THEME_KEYWORDS = [
  // 再エネ
  "再エネ", "再生可能エネルギー", "再生エネ", "太陽光", "太陽電池", "ソーラー", "PV",
  "風力", "洋上風力", "浮体式", "水素", "FIT", "FIP",
  "電力市場", "需給調整", "アグリゲーター", "VPP",
  "カーボンニュートラル", "脱炭素", "GX", "グリーン電力",
  // BESS
  "BESS", "蓄電池", "系統用蓄電池", "蓄電システム", "充放電",
  "容量市場", "バッテリー", "リチウムイオン", "系統安定",
  // 中学受験
  "中学受験", "偏差値", "塾",
  "開成", "麻布", "灘", "桜蔭", "筑駒", "駒東", "海城", "雙葉", "女子学院",
  "早稲田", "本郷",
  "サピックス", "日能研", "四谷大塚", "早稲田アカデミー", "鉄緑会",
  // データセンター（国内）
  "データセンター", "ハイパースケール", "コロケーション", "IDC",
];

function isThemeRelated(text: string): boolean {
  const lower = text.toLowerCase();
  return THEME_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}

async function main() {
  const config = loadConfig();

  console.info("[1/4] X のホームタイムラインを取得中...");
  const allTweets = await fetchHomeTimeline(config, settings);
  console.info(`→ ツイート ${allTweets.length}件 を取得`);
  const tweets = allTweets.filter((t) =>
    isThemeRelated(t.text + (t.quotedText ?? "")),
  );
  console.info(`→ テーマ関連ツイート: ${tweets.length}件（全体の${Math.round((tweets.length / allTweets.length) * 100)}%）`);

  console.info("[2/4] URL本文を Jina Reader で取得中...");
  const urlContents = await fetchUrlContents(tweets, config, settings);
  console.info(`→ 本文取得済みURL: ${urlContents.size}件`);

  const enrichedTweets = await summarizeUrls(
    tweets,
    urlContents,
    config,
    settings,
  );
  const analysis = await analyzeTrends(enrichedTweets, config, settings);

  console.info("[4/4] Slack へ投稿中...");
  await postToSlack(analysis, config);

  console.info("すべての処理が完了しました");
}

main().catch((error: unknown) => {
  if (error instanceof UserFacingError) {
    console.error(`\n[USER-FACING] ${error.message}`);
    console.error("対処法の詳細は docs/troubleshooting.md を参照してください。");
    if (error.cause) {
      console.error("[DETAIL]", error.cause);
    }
  } else {
    console.error("\n[INTERNAL] Unexpected error:", error);
  }
  process.exit(1);
});
