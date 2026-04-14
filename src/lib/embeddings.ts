import { embed, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";

const MODEL = openai.embedding("text-embedding-3-small");

/**
 * Genererar en embedding för en enskild textsträng.
 * Används vid sökning — embeda användarens fråga.
 */
export async function embedText(text: string): Promise<number[]> {
  const { embedding } = await embed({ model: MODEL, value: text });
  return embedding;
}

/**
 * Genererar embeddings för en lista texter i batch.
 * Används vid indexering — embeda alla chunks i ett dokument.
 * AI SDK batchar automatiskt och respekterar rate limits.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({ model: MODEL, values: texts });
  return embeddings;
}
