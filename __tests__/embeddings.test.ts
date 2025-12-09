import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { calculateExactMatches } from "../lib/ai/embeddings";

// Mock the OpenAI module to avoid hanging on initialization
vi.mock("openai", () => ({
  default: vi.fn(() => ({
    embeddings: {
      create: vi.fn(),
    },
  })),
}));

describe("calculateExactMatches", () => {
  it("should NOT match generic 'cheese' with specific 'feta cheese'", () => {
    const userIngredients = ["feta cheese"];
    const recipeIngredients = ["bread", "cheese", "butter"];
    
    const matches = calculateExactMatches(userIngredients, recipeIngredients);
    expect(matches).toBe(0);
  });

  it("should match 'feta cheese' with 'feta cheese' exactly", () => {
    const userIngredients = ["feta cheese"];
    const recipeIngredients = ["tomato", "feta cheese", "olives"];
    
    const matches = calculateExactMatches(userIngredients, recipeIngredients);
    expect(matches).toBe(1);
  });

  it("should match both user ingredients in Greek Salad", () => {
    const userIngredients = ["feta cheese", "olives"];
    const recipeIngredients = ["tomato", "cucumber", "red onion", "olives", "feta cheese", "olive oil", "lemon juice", "oregano"];
    
    const matches = calculateExactMatches(userIngredients, recipeIngredients);
    expect(matches).toBe(2);
  });

  it("should NOT match grilled cheese for feta search", () => {
    const userIngredients = ["feta cheese", "olives"];
    const recipeIngredients = ["bread", "cheese", "butter"];
    
    const matches = calculateExactMatches(userIngredients, recipeIngredients);
    expect(matches).toBe(0);
  });
});
