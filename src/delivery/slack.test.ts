import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Config } from "../config.js";
import type { Analysis } from "../analysis/schema.js";

const mockPostMessage = vi.fn();

vi.mock("@slack/web-api", () => ({
  WebClient: class {
    chat = { postMessage: mockPostMessage };
  },
}));

const { postToSlack } = await import("./slack.js");

const mockConfig: Config = {
  JINA_API_KEY: "test-jina",
  GEMINI_API_KEY: "test-gemini",
  SLACK_BOT_TOKEN: "xoxb-test",
  SLACK_CHANNEL: "C123",
  USE_SAMPLE_DATA: true,
};

const validAnalysis: Analysis = {
  main_news: [
    {
      title: "GPT-5.5が発表",
      details: ["ネイティブtool use対応"],
      sources: ["https://x.com/OpenAI/status/123"],
    },
  ],
  updates: [
    {
      title: "Cursor Background Agent",
      details: ["寝ている間にPR作成"],
      sources: ["https://x.com/cursor/status/456"],
    },
  ],
  tech_trends: [],
};

beforeEach(() => {
  mockPostMessage.mockResolvedValue({ ok: true });
});

describe("postToSlack", () => {
  it("正常な Analysis を投稿できる", async () => {
    await postToSlack(validAnalysis, mockConfig);

    expect(mockPostMessage).toHaveBeenCalledOnce();
    const call = mockPostMessage.mock.calls[0]![0] as {
      channel: string;
      text: string;
      blocks: unknown[];
    };
    expect(call.channel).toBe("C123");
    expect(call.text).toBe("24時間以内のAIトレンド");
    expect(call.blocks.length).toBeGreaterThan(0);
  });

  it("空の Analysis でもエラーにならない", async () => {
    const emptyAnalysis: Analysis = {
      main_news: [],
      updates: [],
      tech_trends: [],
    };
    await expect(
      postToSlack(emptyAnalysis, mockConfig),
    ).resolves.not.toThrow();
  });

  it("Block Kit にヘッダーとセクションが含まれる", async () => {
    await postToSlack(validAnalysis, mockConfig);

    const call = mockPostMessage.mock.calls[0]![0] as {
      blocks: Array<{ type: string }>;
    };
    const types = call.blocks.map((b) => b.type);
    expect(types).toContain("header");
    expect(types).toContain("section");
    expect(types).toContain("divider");
  });
});
