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
    if (!process.env.OPENAI_API_KEY) {
      // Fallback: Use simple token-based embedding for demo
      console.log("EMBEDDING_SOURCE=FALLBACK");
      return generateSimpleEmbedding(text);
    }

    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    console.log("EMBEDDING_SOURCE=OpenAI");
    return response.data[0].embedding;
  } catch (error) {
    console.log("EMBEDDING_SOURCE=FALLBACK (OpenAI error)");
    console.error("OpenAI embedding error:", error);
    // Fallback to simple embedding
    return generateSimpleEmbedding(text);
  }
}

/**
 * Simple embedding fallback for demo purposes
 * Creates a basic vector representation based on word tokens
 */
function generateSimpleEmbedding(text: string): number[] {
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

  return matchedCount / recipeIngredients.length;
}

/**
 * Calculate match count using flexible ingredient matching
 * Supports case-insensitive and partial matches
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
