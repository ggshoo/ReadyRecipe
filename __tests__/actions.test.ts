import { describe, it, expect } from "vitest";

// Test the sorting logic for recipe results
// The sorting should be by coverageScore (match percentage) in descending order
describe("Recipe Results Sorting", () => {
  interface MockRecipeScore {
    recipe: { id: string; name: string };
    coverageScore: number;
    combinedScore: number;
  }

  const sortByCoverageScore = (results: MockRecipeScore[]): MockRecipeScore[] => {
    return [...results].sort((a, b) => b.coverageScore - a.coverageScore);
  };

  it("should sort recipes by coverage score (match percentage) in descending order", () => {
    const mockResults: MockRecipeScore[] = [
      { recipe: { id: "1", name: "Recipe A" }, coverageScore: 0.6, combinedScore: 0.7 },
      { recipe: { id: "2", name: "Recipe B" }, coverageScore: 0.85, combinedScore: 0.65 },
      { recipe: { id: "3", name: "Recipe C" }, coverageScore: 0.3, combinedScore: 0.8 },
    ];

    const sorted = sortByCoverageScore(mockResults);

    // Should be sorted by coverageScore: 85%, 60%, 30%
    expect(sorted[0].recipe.name).toBe("Recipe B"); // 85%
    expect(sorted[1].recipe.name).toBe("Recipe A"); // 60%
    expect(sorted[2].recipe.name).toBe("Recipe C"); // 30%
  });

  it("should place highest match percentage first", () => {
    const mockResults: MockRecipeScore[] = [
      { recipe: { id: "1", name: "Low Match" }, coverageScore: 0.3, combinedScore: 0.9 },
      { recipe: { id: "2", name: "High Match" }, coverageScore: 0.95, combinedScore: 0.5 },
    ];

    const sorted = sortByCoverageScore(mockResults);

    // Even though "Low Match" has higher combinedScore, "High Match" should be first
    expect(sorted[0].recipe.name).toBe("High Match");
    expect(sorted[0].coverageScore).toBe(0.95);
  });

  it("should handle recipes with same coverage score", () => {
    const mockResults: MockRecipeScore[] = [
      { recipe: { id: "1", name: "Recipe A" }, coverageScore: 0.5, combinedScore: 0.6 },
      { recipe: { id: "2", name: "Recipe B" }, coverageScore: 0.5, combinedScore: 0.7 },
      { recipe: { id: "3", name: "Recipe C" }, coverageScore: 0.5, combinedScore: 0.5 },
    ];

    const sorted = sortByCoverageScore(mockResults);

    // All have same coverage score, so their relative order may vary
    // but all should have the same coverageScore
    expect(sorted.every((r) => r.coverageScore === 0.5)).toBe(true);
  });

  it("should sort from 100% to 0% correctly", () => {
    const mockResults: MockRecipeScore[] = [
      { recipe: { id: "1", name: "0% Match" }, coverageScore: 0, combinedScore: 0.5 },
      { recipe: { id: "2", name: "100% Match" }, coverageScore: 1, combinedScore: 0.5 },
      { recipe: { id: "3", name: "50% Match" }, coverageScore: 0.5, combinedScore: 0.5 },
    ];

    const sorted = sortByCoverageScore(mockResults);

    expect(sorted[0].recipe.name).toBe("100% Match");
    expect(sorted[1].recipe.name).toBe("50% Match");
    expect(sorted[2].recipe.name).toBe("0% Match");
  });
});
