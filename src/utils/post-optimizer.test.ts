import { describe, it, expect, vi } from "vitest";
import { extractUrls, cleanText, expandUrls } from "./post-optimizer.js";

describe("extractUrls", () => {
  it("テキストからURLを抽出する", () => {
    const text = "Check out https://example.com and http://foo.bar/path";
    expect(extractUrls(text)).toEqual([
      "https://example.com",
      "http://foo.bar/path",
    ]);
  });

  it("URLがなければ空配列を返す", () => {
    expect(extractUrls("no urls here")).toEqual([]);
  });

  it("t.co短縮URLも抽出する", () => {
    const text = "見て https://t.co/abc123 すごい";
    expect(extractUrls(text)).toEqual(["https://t.co/abc123"]);
  });
});

describe("cleanText", () => {
  it("URLを除去する", () => {
    expect(cleanText("hello https://example.com world")).toBe("hello world");
  });

  it("絵文字を除去する", () => {
    expect(cleanText("すごい🔥ニュース")).toBe("すごいニュース");
  });

  it("改行をスペースに変換する", () => {
    expect(cleanText("line1\nline2")).toBe("line1 line2");
  });

  it("全角スペースを除去する", () => {
    expect(cleanText("全角\u3000スペース")).toBe("全角スペース");
  });

  it("連続スペースを1つにまとめる", () => {
    expect(cleanText("multiple   spaces")).toBe("multiple spaces");
  });

  it("連続する！を1つにまとめる", () => {
    expect(cleanText("すごい！！！")).toBe("すごい！");
  });

  it("連続する。を1つにまとめる", () => {
    expect(cleanText("終わり。。。")).toBe("終わり。");
  });

  it("複合的なクリーニングが正しく動く", () => {
    const input =
      "🔥 新モデル https://example.com が発表！！！  すごい。。。";
    const expected = "新モデル が発表！ すごい。";
    expect(cleanText(input)).toBe(expected);
  });
});

describe("expandUrls", () => {
  it("空配列を渡すと空Mapを返す", async () => {
    const result = await expandUrls([]);
    expect(result.size).toBe(0);
  });

  it("x.com のURLを除外する", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ url: "https://x.com/user/status/123" }),
    );
    const result = await expandUrls(["https://t.co/abc"]);
    expect(result.size).toBe(0);
  });

  it("twitter.com のURLを除外する", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ url: "https://twitter.com/user/status/123" }),
    );
    const result = await expandUrls(["https://t.co/def"]);
    expect(result.size).toBe(0);
  });

  it("外部URLは元URL→展開URLのMapで返す", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ url: "https://openai.com/blog/gpt5" }),
    );
    const result = await expandUrls(["https://t.co/ghi"]);
    expect(result.size).toBe(1);
    expect(result.get("https://t.co/ghi")).toBe("https://openai.com/blog/gpt5");
  });

  it("fetchが失敗したURLはスキップする", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network error")),
    );
    const result = await expandUrls(["https://t.co/fail"]);
    expect(result.size).toBe(0);
  });
});
