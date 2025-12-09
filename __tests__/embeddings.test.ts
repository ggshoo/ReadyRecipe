import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";

const originalEnv = { ...process.env };

describe("generateEmbedding logging behaviour", () => {
  beforeEach(() => {
    // reset module cache to ensure imports pick up env changes
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("logs FALLBACK when OPENAI_API_KEY is not set", async () => {
    // Ensure key is not set
    delete process.env.OPENAI_API_KEY;

    // Import after adjusting env
    const { generateEmbedding } = await import("../lib/ai/embeddings");

    // Spy on console.log
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    // Run generateEmbedding - it should take the fallback path
    await generateEmbedding("eggs tomato");

    expect(logSpy).toHaveBeenCalledWith("EMBEDDING_SOURCE=FALLBACK");
  });

  it("logs FALLBACK (OpenAI error) path (simulated by forcing fallback)", async () => {
    // Ensure we can simulate the fallback path without calling real OpenAI
    delete process.env.OPENAI_API_KEY;

    const { generateEmbedding } = await import("../lib/ai/embeddings");

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await generateEmbedding("simulate error");

    // Expect fallback log to have been emitted
    expect(logSpy).toHaveBeenCalledWith("EMBEDDING_SOURCE=FALLBACK");

    errorSpy.mockRestore();
    logSpy.mockRestore();
  });
});

describe("calculateExactMatches", () => {
  it("should NOT match generic 'cheese' with specific 'feta cheese'", async () => {
    const { calculateExactMatches } = await import("../lib/ai/embeddings");
    
    const userIngredients = ["feta cheese"];
    const recipeIngredients = ["bread", "cheese", "butter"];
    
    const matches = calculateExactMatches(userIngredients, recipeIngredients);
    expect(matches).toBe(0);
  });

  it("should match 'feta cheese' with 'feta cheese' exactly", async () => {
    const { calculateExactMatches } = await import("../lib/ai/embeddings");
    
    const userIngredients = ["feta cheese"];
    const recipeIngredients = ["tomato", "feta cheese", "olives"];
    
    const matches = calculateExactMatches(userIngredients, recipeIngredients);
    expect(matches).toBe(1);
  });

  it("should match both user ingredients in Greek Salad", async () => {
    const { calculateExactMatches } = await import("../lib/ai/embeddings");
    
    const userIngredients = ["feta cheese", "olives"];
    const recipeIngredients = ["tomato", "cucumber", "red onion", "olives", "feta cheese", "olive oil", "lemon juice", "oregano"];
    
    const matches = calculateExactMatches(userIngredients, recipeIngredients);
    expect(matches).toBe(2);
  });

  it("should NOT match grilled cheese for feta search", async () => {
    const { calculateExactMatches } = await import("../lib/ai/embeddings");
    
    const userIngredients = ["feta cheese", "olives"];
    const recipeIngredients = ["bread", "cheese", "butter"];
    
    const matches = calculateExactMatches(userIngredients, recipeIngredients);
    expect(matches).toBe(0);
  });
});
