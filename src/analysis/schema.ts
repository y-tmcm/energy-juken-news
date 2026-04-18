import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const TopicSchema = z.object({
  title: z.string(),
  details: z.array(z.string()).max(3),
  sources: z.array(z.string()),
});

export const AnalysisSchema = z.object({
  main_news: z.array(TopicSchema).min(3),
  updates: z.array(TopicSchema).min(3),
  tech_trends: z.array(TopicSchema).min(3),
});

export type Analysis = z.infer<typeof AnalysisSchema>;

export const analysisResponseSchema = zodToJsonSchema(AnalysisSchema, {
  target: "openApi3",
  $refStrategy: "none",
});
