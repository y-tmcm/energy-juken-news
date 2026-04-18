export interface Settings {
  schedule: {
    lookbackHours: number;
    maxTweets: number;
  };
  urlContent: {
    enabled: boolean;
    timeoutMs: number;
    parallelism: number;
    maxSummaryChars: number;
    inputCharsMultiplier: number;
  };
  analysis: {
    urlSummaryModel: string;
    trendAnalysisModel: string;
    temperature: number;
  };
}

export const settings: Settings = {
  schedule: {
    lookbackHours: 48,
    maxTweets: 100,
  },
  urlContent: {
    enabled: true,
    timeoutMs: 10_000,
    parallelism: 1,
    maxSummaryChars: 200,
    inputCharsMultiplier: 5,
  },
  analysis: {
    urlSummaryModel: "gemma-3-4b-it",
    trendAnalysisModel: "gemini-2.5-flash",
    temperature: 0,
  },
};
