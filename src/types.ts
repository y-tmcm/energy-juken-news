export interface RawTweet {
  authorId: string;
  text: string;
  createdAt: string;
  url: string;
  quotedText?: string;
}

export interface EnrichedTweet extends RawTweet {
  enrichedText: string;
}
