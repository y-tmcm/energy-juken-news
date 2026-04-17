import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { loadConfig } from "./config.js";

describe("loadConfig", () => {
  const original = process.env;

  beforeEach(() => {
    process.env = { ...original };
  });

  afterAll(() => {
    process.env = original;
  });

  const commonEnv = {
    JINA_API_KEY: "test",
    GEMINI_API_KEY: "test",
    SLACK_BOT_TOKEN: "xoxb-test",
    SLACK_CHANNEL: "C123",
  };

  it("正常な環境変数をパースできる", () => {
    process.env = {
      ...original,
      ...commonEnv,
      X_CONSUMER_KEY: "ck",
      X_CONSUMER_SECRET: "cs",
      X_ACCESS_TOKEN: "at",
      X_ACCESS_TOKEN_SECRET: "ats",
    };
    const config = loadConfig();
    expect(config.USE_SAMPLE_DATA).toBe(false);
    expect(config.GEMINI_API_KEY).toBe("test");
  });

  it("USE_SAMPLE_DATA=true を boolean に変換する", () => {
    process.env = { ...original, ...commonEnv, USE_SAMPLE_DATA: "true" };
    const config = loadConfig();
    expect(config.USE_SAMPLE_DATA).toBe(true);
  });

  it("必須キーが欠落すると process.exit(1) を呼ぶ", () => {
    process.env = {};
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((() => {
        throw new Error("process.exit called");
      }) as never);
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => loadConfig()).toThrow("process.exit called");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("USE_SAMPLE_DATA=true のとき X_* なしで成功する", () => {
    process.env = { ...original, ...commonEnv, USE_SAMPLE_DATA: "true" };
    const config = loadConfig();
    expect(config.USE_SAMPLE_DATA).toBe(true);
  });

  it("USE_SAMPLE_DATA=false かつ X_* なしで process.exit(1)", () => {
    process.env = { ...original, ...commonEnv, USE_SAMPLE_DATA: "false" };
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((() => {
        throw new Error("process.exit called");
      }) as never);
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => loadConfig()).toThrow("process.exit called");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it("USE_SAMPLE_DATA=false かつ X_* 全てありで成功する", () => {
    process.env = {
      ...original,
      ...commonEnv,
      USE_SAMPLE_DATA: "false",
      X_CONSUMER_KEY: "ck",
      X_CONSUMER_SECRET: "cs",
      X_ACCESS_TOKEN: "at",
      X_ACCESS_TOKEN_SECRET: "ats",
    };
    const config = loadConfig();
    expect(config.USE_SAMPLE_DATA).toBe(false);
    if (!config.USE_SAMPLE_DATA) {
      expect(config.X_CONSUMER_KEY).toBe("ck");
    }
  });

  it("USE_SAMPLE_DATA=false かつ X_* が一部だけだと process.exit(1)", () => {
    process.env = {
      ...original,
      ...commonEnv,
      USE_SAMPLE_DATA: "false",
      X_CONSUMER_KEY: "ck",
      X_CONSUMER_SECRET: "cs",
    };
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((() => {
        throw new Error("process.exit called");
      }) as never);
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => loadConfig()).toThrow("process.exit called");
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
