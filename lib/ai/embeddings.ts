import OpenAI from "openai";
import { ingredientMatches } from "../utils";

// Lazy-initialize OpenAI client to avoid hanging on module load
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-demo",
    });
  }
  return openai;
}

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
    const response = await getOpenAIClient().embeddings.create({
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
 * Creates very distinctive vector representations based on character content
 * Different ingredients get very different embedding vectors
 */
export function generateSimpleEmbedding(text: string): number[] {
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const embedding = new Array(384).fill(0); // 384-dimensional vector

  // Create a very sparse and distinctive embedding
  // Each character activates specific dimensions uniquely
  for (let wordIdx = 0; wordIdx < words.length; wordIdx++) {
    const word = words[wordIdx];
    
    for (let charIdx = 0; charIdx < word.length; charIdx++) {
      const charCode = word.charCodeAt(charIdx);
      
      // Each character+position combination maps to a unique set of dimensions
      // Use multiple independent hash functions to spread activation
      const dim1 = Math.abs((charCode * 73) ^ (charIdx * 131) ^ (wordIdx * 37)) % 384;
      const dim2 = Math.abs((charCode * 97) ^ (charIdx * 179) ^ (wordIdx * 53)) % 384;
      const dim3 = Math.abs((charCode * 113) ^ (charIdx * 211) ^ (wordIdx * 67)) % 384;
      
      // Activate different dimensions with different magnitudes
      embedding[dim1] += Math.sin(charCode * 0.02) * (1 + wordIdx * 0.1);
      embedding[dim2] -= Math.cos(charCode * 0.025) * (1 + charIdx * 0.05);
      embedding[dim3] += Math.sin((charCode + charIdx) * 0.015);
    }
  }

  // Add structural information about the text
  // This helps distinguish recipes with very different ingredient lists
  const totalChars = words.reduce((sum, w) => sum + w.length, 0);
  const avgWordLen = totalChars / Math.max(1, words.length);
  
  // Encode word count and average word length in specific dimensions
  for (let i = 0; i < Math.min(words.length, 20); i++) {
    const idx = (i * 19) % 384;
    embedding[idx] += 0.15 * Math.sin(avgWordLen * 0.3 + i);
  }

  // Normalize to unit vector - but ensure we don't lose the sparsity pattern
  let magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude < 0.001) {
    // Create a unique default vector based on text hash
    const hash = text.split('').reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0);
    for (let i = 0; i < 384; i++) {
      embedding[i] = Math.sin((hash + i) * 0.001);
    }
    magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  }
  
  return embedding.map((val) => val / magnitude);
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
 * Calculate the ingredient match rate: what % of user's ingredients are found in this recipe?
 * Returns a percentage (0-1) of user ingredients that have a match in the recipe
 * E.g., user searches ["feta cheese", "olives"], recipe has both -> 100% (2/2)
 *       user searches ["feta cheese", "olives"], recipe has only olives -> 50% (1/2)
 */
export function calculateIngredientMatchRate(
  userIngredients: string[],
  recipeIngredients: string[]
): number {
  if (userIngredients.length === 0) return 0;
  
  // Count how many user ingredients are found in the recipe
  const foundCount = userIngredients.filter((userIngredient) =>
    recipeIngredients.some((recipeIngredient) =>
      ingredientMatches(userIngredient, recipeIngredient)
    )
  ).length;

  // Return percentage of user ingredients found
  return foundCount / userIngredients.length;
}

/**
 * Calculate number of exact ingredient matches
 * Counts how many recipe ingredients match user ingredients using flexible matching
 */
/**
 * Calculate how many recipe ingredients have TRUE EXACT matches with user ingredients
 * (i.e., the user ingredient and recipe ingredient are nearly identical)
 * This penalizes recipes with generic ingredients when user wants specific ones
 * E.g., user "feta cheese" + recipe "cheese" = NOT an exact match (too generic)
 *       user "feta cheese" + recipe "feta cheese" = exact match
 */
export function calculateExactMatches(
  userIngredients: string[],
  recipeIngredients: string[]
): number {
  return recipeIngredients.filter((recipeIngredient) =>
    userIngredients.some((userIngredient) => {
      const userLower = userIngredient.toLowerCase().trim();
      const recipeLower = recipeIngredient.toLowerCase().trim();
      
      // Only count as exact match if the strings are identical or very similar
      // (not just one word matching within the other)
      if (userLower === recipeLower) {
        return true;
      }
      
      // Allow minor variations like plurals or slight differences
      // but don't allow "cheese" to match "feta cheese"
      const userWords = userLower.split(/\s+/);
      const recipeWords = recipeLower.split(/\s+/);
      
      // If one is a single word and the other is multi-word, it's not exact
      if ((userWords.length === 1 && recipeWords.length > 1) ||
          (userWords.length > 1 && recipeWords.length === 1)) {
        return false;
      }
      
      // For multi-word ingredients, all words from shorter one should be in longer one
      if (userWords.length !== recipeWords.length) {
        const shorter = userWords.length < recipeWords.length ? userWords : recipeWords;
        const longer = userWords.length < recipeWords.length ? recipeWords : userWords;
        return shorter.every(word => longer.includes(word));
      }
      
      // For same word count, they should match exactly
      return userWords.every((word, idx) => word === recipeWords[idx]);
    })
  ).length;
}
