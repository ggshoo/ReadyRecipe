import OpenAI from "openai";
import { ingredientMatches } from "../utils";

// Initialize OpenAI client (will use embedding model)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-demo",
});

/**
 * Generate embeddings for text using OpenAI's embedding model
 * For MVP, we use a simple text-based similarity if OpenAI key is not available
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Use OpenAI if an API key is present
    if (!process.env.OPENAI_API_KEY) {
      // Explicit fallback log
      console.log("EMBEDDING_SOURCE=FALLBACK");
      return generateSimpleEmbedding(text);
    }

    // Attempt OpenAI embedding
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    // Successful OpenAI inference
    console.log("EMBEDDING_SOURCE=OpenAI");
    return response.data[0].embedding;
  } catch (error) {
    // If OpenAI call fails, log fallback (and error for debug without secrets)
    try {
      // Best-effort: do not print secrets
      // Provide a short debug error message
      console.error("OpenAI embedding error (debug):", error);
    } catch (_) {
      /* swallow any logging errors */
    }
    console.log("EMBEDDING_SOURCE=FALLBACK (OpenAI error)");
    return generateSimpleEmbedding(text);
  }
}

/**
 * Simple embedding fallback for demo purposes
 * Creates a basic vector representation based on word tokens
 */
export function generateSimpleEmbedding(text: string): number[] {
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(384).fill(0); // 384-dimensional vector

  // Simple hash-based embedding
  words.forEach((word, idx) => {
    const hash = simpleHash(word);
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] += Math.sin(hash + i * 0.1) * (1 / (idx + 1));
    }
  });

  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) {
    return embedding;
  }
  return embedding.map((val) => val / magnitude);
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}

/**
 * Calculate cosine similarity between two embedding vectors
 */
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    magnitude1 += vec1[i] * vec1[i];
    magnitude2 += vec2[i] * vec2[i];
  }

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Calculate ingredient coverage score (what fraction of recipe ingredients are available)
 * Uses flexible matching - partial and case-insensitive matches are counted
 */
export function calculateCoverageScore(
  userIngredients: string[],
  recipeIngredients: string[]
): number {
  const matchedCount = recipeIngredients.filter((recipeIngredient) =>
    userIngredients.some((userIngredient) =>
      ingredientMatches(userIngredient, recipeIngredient)
    )
  ).length;

  return recipeIngredients.length === 0 ? 0 : matchedCount / recipeIngredients.length;
}

/**
 * Calculate exact matches count (number of recipe ingredients that match user ingredients)
 * Uses flexible matching - partial and case-insensitive matches are counted
 */
export function calculateExactMatches(
  userIngredients: string[],
  recipeIngredients: string[]
): number {
  return recipeIngredients.filter((recipeIngredient) =>
    userIngredients.some((userIngredient) =>
      ingredientMatches(userIngredient, recipeIngredient)
    )
  ).length;
}

/** (optional) exports for unit tests or other modules */
const embeddingsExports = {
  generateEmbedding,
  generateSimpleEmbedding,
  cosineSimilarity,
  calculateCoverageScore,
  calculateExactMatches,
};

export default embeddingsExports;
