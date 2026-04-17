import { describe, it, expect } from "vitest";
import { fetchHomeTimeline } from "./x-timeline.js";
import type { Config } from "../config.js";
import { settings } from "../settings.js";

const mockConfig: Config = {
  JINA_API_KEY: "test-jina",
  GEMINI_API_KEY: "test-gemini",
  SLACK_BOT_TOKEN: "xoxb-test",
  SLACK_CHANNEL: "C123",
  USE_SAMPLE_DATA: true,
};

describe("fetchHomeTimeline (モックルート)", () => {
  it("USE_SAMPLE_DATA=true で fixtures/sample-tweets.json を読み込む", async () => {
    const tweets = await fetchHomeTimeline(mockConfig, settings);
    expect(tweets.length).toBe(30);
  });

  it("各ツイートに必須フィールドがある", async () => {
    const tweets = await fetchHomeTimeline(mockConfig, settings);
    for (const tweet of tweets) {
      expect(tweet.authorId).toBeDefined();
      expect(typeof tweet.authorId).toBe("string");
      expect(tweet.text).toBeDefined();
      expect(typeof tweet.text).toBe("string");
      expect(tweet.createdAt).toBeDefined();
      expect(tweet.url).toBeDefined();
      expect(tweet.url).toMatch(/^https:\/\/x\.com\//);
    }
  });
});
