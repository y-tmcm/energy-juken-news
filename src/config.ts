import { z } from "zod";

const baseSchema = z.object({
  JINA_API_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  SLACK_BOT_TOKEN: z.string().startsWith("xoxb-"),
  SLACK_CHANNEL: z.string().startsWith("C"),
  USE_SAMPLE_DATA: z
    .enum(["true", "false", ""])
    .default("false")
    .transform((v) => v === "true"),
});

const xSchema = z.object({
  X_CONSUMER_KEY: z.string().min(1),
  X_CONSUMER_SECRET: z.string().min(1),
  X_ACCESS_TOKEN: z.string().min(1),
  X_ACCESS_TOKEN_SECRET: z.string().min(1),
});

type BaseParsed = z.infer<typeof baseSchema>;
type XParsed = z.infer<typeof xSchema>;
type Common = Omit<BaseParsed, "USE_SAMPLE_DATA">;

export type Config =
  | (Common & { USE_SAMPLE_DATA: true })
  | (Common & { USE_SAMPLE_DATA: false } & XParsed);

export function loadConfig(): Config {
  const baseResult = baseSchema.safeParse(process.env);
  if (!baseResult.success) {
    reportAndExit("環境変数の検証に失敗しました", baseResult.error);
  }

  const { USE_SAMPLE_DATA, ...common } = baseResult.data;

  if (USE_SAMPLE_DATA) {
    return { ...common, USE_SAMPLE_DATA: true };
  }

  const xResult = xSchema.safeParse(process.env);
  if (!xResult.success) {
    reportAndExit(
      "X API の環境変数が揃っていません（USE_SAMPLE_DATA=false のとき X_CONSUMER_KEY / X_CONSUMER_SECRET / X_ACCESS_TOKEN / X_ACCESS_TOKEN_SECRET の4つが必須）。モックで動作確認したい場合は USE_SAMPLE_DATA=true を指定してください",
      xResult.error,
    );
  }

  return { ...common, USE_SAMPLE_DATA: false, ...xResult.data };
}

function reportAndExit(title: string, error: z.ZodError): never {
  const missing = error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  console.error(`[CONFIG] ${title}:\n${missing}`);
  process.exit(1);
}
