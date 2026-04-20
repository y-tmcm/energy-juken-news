import { GoogleGenAI } from "@google/genai";
import type { Config } from "../config.js";
import type { Settings } from "../settings.js";
import type { RawTweet, EnrichedTweet } from "../types.js";
import { extractUrls } from "../utils/post-optimizer.js";
import { chunkArray } from "../utils/chunk.js";
import { URL_SUMMARY_PROMPT } from "./prompts.js";

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
];

function relevanceScore(text: string): number {
  const lower = text.toLowerCase();
  return THEME_KEYWORDS.filter((kw) => lower.includes(kw.toLowerCase())).length;
}

function prioritizeUrls(
  urlContents: Map<string, string>,
  tweets: RawTweet[],
  maxUrls: number,
): [string, string][] {
  const urlToScore = new Map<string, number>();
  for (const tweet of tweets) {
    const score = relevanceScore(tweet.text + (tweet.quotedText ?? ""));
    for (const url of extractUrls(tweet.text)) {
      const prev = urlToScore.get(url) ?? 0;
      urlToScore.set(url, Math.max(prev, score));
    }
  }
  return [...urlContents.entries()]
    .sort((a, b) => (urlToScore.get(b[0]) ?? 0) - (urlToScore.get(a[0]) ?? 0))
    .slice(0, maxUrls);
}

export async function summarizeUrls(
  tweets: RawTweet[],
  urlContents: Map<string, string>,
  config: Config,
  settings: Settings,
): Promise<EnrichedTweet[]> {
  if (urlContents.size === 0) {
    return tweets.map((t) => ({ ...t, enrichedText: buildFullText(t) }));
  }

  console.info(`[3a/4] 各URLを ${settings.analysis.urlSummaryModel} で要約中...`);
  const ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
  const summaryCache = new Map<string, string>();
  const MAX_URLS = 20;
  const SLEEP_MS = 12_000;
  const entries = prioritizeUrls(urlContents, tweets, MAX_URLS);
  console.info(`→ URL要約対象: ${entries.length}件（テーマ関連優先・上限${MAX_URLS}件）`);

  const chunks = chunkArray(entries, settings.urlContent.parallelism);
  for (const [i, chunk] of chunks.entries()) {
    if (i > 0) await new Promise((r) => setTimeout(r, SLEEP_MS));
    const results = await Promise.allSettled(
      chunk.map(async ([url, content]) => {
        const truncated = content.slice(
          0,
          settings.urlContent.maxSummaryChars *
            settings.urlContent.inputCharsMultiplier,
        );
        const prompt = URL_SUMMARY_PROMPT.replace(
          "{article_text}",
          truncated,
        );

        const res = await ai.models.generateContent({
          model: settings.analysis.urlSummaryModel,
          contents: prompt,
          config: { temperature: 0 },
        });

        const text = res.text?.slice(0, settings.urlContent.maxSummaryChars);
        return { url, summary: text ?? "" };
      }),
    );

    for (const r of results) {
      if (r.status === "fulfilled" && r.value.summary) {
        summaryCache.set(r.value.url, r.value.summary);
      } else if (r.status === "rejected") {
        console.warn(`→ URL要約失敗: ${String(r.reason)}`);
      }
    }
  }

  console.info(`→ URL要約完了: ${summaryCache.size}件`);

  return tweets.map((tweet) => {
    let enrichedText = buildFullText(tweet);
    for (const url of extractUrls(tweet.text)) {
      const summary = summaryCache.get(url);
      if (summary) {
        enrichedText += `\n[補足情報]: ${summary}`;
      }
    }
    return { ...tweet, enrichedText };
  });
}

function buildFullText(tweet: RawTweet): string {
  let text = tweet.text;
  if (tweet.quotedText) {
    text += `\n${tweet.quotedText}`;
  }
  return text;
}

