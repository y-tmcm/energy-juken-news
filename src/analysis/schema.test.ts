import { describe, it, expect } from "vitest";
import { AnalysisSchema, analysisResponseSchema } from "./schema.js";

const validAnalysis = {
  main_news: [
    {
      title: "GPT-5.5が発表",
      details: ["ネイティブtool use対応", "推論速度が大幅向上"],
      sources: ["https://x.com/OpenAI/status/123"],
    },
  ],
  updates: [
    {
      title: "Cursor Background Agent",
      details: ["寝ている間にPRを作成"],
      sources: ["https://x.com/cursor/status/456"],
    },
  ],
  tech_trends: [
    {
      title: "テスト時計算量スケーリング",
      details: ["より大きなモデルからスマートな推論へ", "推論コスト削減"],
      sources: ["https://x.com/research/status/789"],
    },
  ],
};

describe("AnalysisSchema", () => {
  it("正常なデータをパースできる", () => {
    const result = AnalysisSchema.parse(validAnalysis);
    expect(result.main_news).toHaveLength(1);
    expect(result.updates).toHaveLength(1);
    expect(result.tech_trends).toHaveLength(1);
  });

  it("空セクションを許容する", () => {
    const result = AnalysisSchema.parse({
      main_news: [],
      updates: [],
      tech_trends: [],
    });
    expect(result.main_news).toHaveLength(0);
  });

  it("必須フィールドが欠けるとエラー", () => {
    expect(() =>
      AnalysisSchema.parse({ main_news: [], updates: [] }),
    ).toThrow();
  });

  it("details が3つを超えるとエラー", () => {
    expect(() =>
      AnalysisSchema.parse({
        main_news: [
          {
            title: "test",
            details: ["1", "2", "3", "4"],
            sources: [],
          },
        ],
        updates: [],
        tech_trends: [],
      }),
    ).toThrow();
  });

  it("details が3つちょうどは許容する", () => {
    const result = AnalysisSchema.parse({
      main_news: [
        {
          title: "test",
          details: ["1", "2", "3"],
          sources: [],
        },
      ],
      updates: [],
      tech_trends: [],
    });
    expect(result.main_news[0]!.details).toHaveLength(3);
  });
});

describe("analysisResponseSchema", () => {
  it("JSON Schema オブジェクトが生成される", () => {
    expect(analysisResponseSchema).toBeDefined();
    expect(typeof analysisResponseSchema).toBe("object");
  });

  it("3つのセクションプロパティを含む", () => {
    const schema = analysisResponseSchema as Record<string, unknown>;
    const props = (schema as { properties?: Record<string, unknown> })
      .properties;
    expect(props).toBeDefined();
    expect(props).toHaveProperty("main_news");
    expect(props).toHaveProperty("updates");
    expect(props).toHaveProperty("tech_trends");
  });
});
