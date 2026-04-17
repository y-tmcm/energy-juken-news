import { TwitterApi } from "twitter-api-v2";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Config } from "../config.js";
import type { Settings } from "../settings.js";
import type { RawTweet } from "../types.js";

export async function fetchHomeTimeline(
  config: Config,
  settings: Settings,
): Promise<RawTweet[]> {
  if (config.USE_SAMPLE_DATA) {
    return loadSampleTweets();
  }
  return fetchFromX(config, settings);
}

async function loadSampleTweets(): Promise<RawTweet[]> {
  const path = resolve(import.meta.dirname, "../../fixtures/sample-tweets.json");
  const raw = await readFile(path, "utf-8");
  return JSON.parse(raw) as RawTweet[];
}

type RealConfig = Extract<Config, { USE_SAMPLE_DATA: false }>;

async function fetchFromX(
  config: RealConfig,
  settings: Settings,
): Promise<RawTweet[]> {
  const client = new TwitterApi({
    appKey: config.X_CONSUMER_KEY,
    appSecret: config.X_CONSUMER_SECRET,
    accessToken: config.X_ACCESS_TOKEN,
    accessSecret: config.X_ACCESS_TOKEN_SECRET,
  });

  const me = await client.v2.me();
  const userId = me.data.id;
  console.info(`X 認証成功: @${me.data.username} (${userId})`);

  const cutoff = new Date(
    Date.now() - settings.schedule.lookbackHours * 60 * 60 * 1000,
  );
  const posts: RawTweet[] = [];
  let paginationToken: string | undefined;

  while (posts.length < settings.schedule.maxTweets) {
    const timeline = await client.v2.homeTimeline({
      max_results: 100,
      ...(paginationToken ? { pagination_token: paginationToken } : {}),
      "tweet.fields": "created_at,text,author_id,referenced_tweets,note_tweet",
      "user.fields": "username",
      expansions: "author_id,referenced_tweets.id",
      exclude: "retweets",
    });

    if (!timeline.data.data?.length) break;

    const users = new Map<string, string>();
    for (const user of timeline.includes?.users ?? []) {
      users.set(user.id, user.username);
    }

    const quotedTweets = new Map<string, (typeof timeline.includes.tweets)[0]>();
    for (const tweet of timeline.includes?.tweets ?? []) {
      quotedTweets.set(tweet.id, tweet);
    }

    for (const tweet of timeline.data.data) {
      const createdAt = tweet.created_at ?? "";
      if (new Date(createdAt) < cutoff) {
        return posts;
      }

      const text = getNoteText(tweet) ?? tweet.text;

      let quotedText: string | undefined;
      for (const ref of tweet.referenced_tweets ?? []) {
        if (ref.type === "quoted") {
          const quoted = quotedTweets.get(ref.id);
          if (quoted) {
            const quoteAuthor = users.get(quoted.author_id ?? "") ?? "unknown";
            const qText = getNoteText(quoted) ?? quoted.text;
            quotedText = `引用ツイート by @${quoteAuthor}: ${qText}`;
          }
        }
      }

      const author = users.get(tweet.author_id ?? "") ?? "";
      posts.push({
        authorId: author,
        text,
        createdAt,
        url: `https://x.com/${author}/status/${tweet.id}`,
        ...(quotedText ? { quotedText } : {}),
      });
    }

    console.info(`→ これまでに ${posts.length}件 取得`);

    paginationToken = timeline.data.meta?.next_token;
    if (!paginationToken) break;

    await sleep(1_000);
  }

  return posts;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// twitter-api-v2 の型定義には note_tweet が含まれないため unknown 経由でアクセス
function getNoteText(tweet: unknown): string | undefined {
  const obj = tweet as { note_tweet?: { text?: string } };
  return obj.note_tweet?.text;
}
