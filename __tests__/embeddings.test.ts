import { describe, it, expect } from "vitest";
import {
  calculateCoverageScore,
  calculateExactMatches,
} from "../lib/ai/embeddings";

describe("calculateCoverageScore", () => {
  describe("exact matching", () => {
    it("should return 1.0 when all recipe ingredients are matched exactly", () => {
      const userIngredients = ["chicken", "onion", "garlic"];
      const recipeIngredients = ["chicken", "onion", "garlic"];
      expect(calculateCoverageScore(userIngredients, recipeIngredients)).toBe(1);
    });

    it("should return 0 when no ingredients match", () => {
      const userIngredients = ["chicken", "onion"];
      const recipeIngredients = ["beef", "tomato", "cheese"];
      expect(calculateCoverageScore(userIngredients, recipeIngredients)).toBe(0);
    });

    it("should return partial score for partial matches", () => {
      const userIngredients = ["chicken", "onion"];
      const recipeIngredients = ["chicken", "onion", "garlic", "soy sauce"];
      expect(calculateCoverageScore(userIngredients, recipeIngredients)).toBe(0.5);
    });
  });

  describe("case-insensitive matching", () => {
    it("should match ingredients regardless of case", () => {
      const userIngredients = ["CHICKEN", "Onion", "garlic"];
      const recipeIngredients = ["chicken", "onion", "GARLIC"];
      expect(calculateCoverageScore(userIngredients, recipeIngredients)).toBe(1);
    });
  });

  describe("partial/flexible matching", () => {
    it("should match partial ingredient names (user ingredient in recipe ingredient)", () => {
      const userIngredients = ["cauliflower"];
      const recipeIngredients = ["Cauliflower Rice"];
      expect(calculateCoverageScore(userIngredients, recipeIngredients)).toBe(1);
    });

    it("should match partial ingredient names (recipe ingredient in user ingredient)", () => {
      const userIngredients = ["chicken breast"];
      const recipeIngredients = ["chicken"];
      expect(calculateCoverageScore(userIngredients, recipeIngredients)).toBe(1);
    });

    it("should match compound ingredients flexibly", () => {
      const userIngredients = ["pepper", "cream"];
      const recipeIngredients = ["bell pepper", "sour cream", "cheese"];
      expect(calculateCoverageScore(userIngredients, recipeIngredients)).toBeCloseTo(2/3);
    });

    it("should handle legacy recipe format with new flexible matching", () => {
      const userIngredients = ["green", "rice"];
      const recipeIngredients = ["green beans", "rice", "eggs"];
      expect(calculateCoverageScore(userIngredients, recipeIngredients)).toBeCloseTo(2/3);
    });
  });
});

describe("calculateExactMatches", () => {
  describe("exact matching", () => {
    it("should count all matches when ingredients match exactly", () => {
      const userIngredients = ["chicken", "onion", "garlic"];
      const recipeIngredients = ["chicken", "onion", "garlic"];
      expect(calculateExactMatches(userIngredients, recipeIngredients)).toBe(3);
    });

    it("should return 0 when no ingredients match", () => {
      const userIngredients = ["chicken", "onion"];
      const recipeIngredients = ["beef", "tomato", "cheese"];
      expect(calculateExactMatches(userIngredients, recipeIngredients)).toBe(0);
    });
  });

  describe("case-insensitive matching", () => {
    it("should match ingredients regardless of case", () => {
      const userIngredients = ["CHICKEN", "Onion"];
      const recipeIngredients = ["chicken", "onion", "garlic"];
      expect(calculateExactMatches(userIngredients, recipeIngredients)).toBe(2);
    });
  });

  describe("partial/flexible matching", () => {
    it("should count partial matches (user ingredient in recipe ingredient)", () => {
      const userIngredients = ["cauliflower", "rice"];
      const recipeIngredients = ["Cauliflower Rice", "chicken breast"];
      expect(calculateExactMatches(userIngredients, recipeIngredients)).toBe(1);
    });

    it("should count partial matches (recipe ingredient in user ingredient)", () => {
      const userIngredients = ["chicken breast", "soy sauce"];
      const recipeIngredients = ["chicken", "soy sauce"];
      expect(calculateExactMatches(userIngredients, recipeIngredients)).toBe(2);
    });

    it("should handle compound ingredient matching", () => {
      const userIngredients = ["bell", "sour"];
      const recipeIngredients = ["bell pepper", "sour cream", "cheese"];
      expect(calculateExactMatches(userIngredients, recipeIngredients)).toBe(2);
    });
  });
});

describe("Recipe Search Integration", () => {
  it("should work with typical recipe search scenario", () => {
    const userIngredients = ["cauliflower", "chicken", "garlic"];
    const recipeIngredients = ["Cauliflower Rice", "chicken breast", "garlic", "soy sauce"];
    
    const coverage = calculateCoverageScore(userIngredients, recipeIngredients);
    const matches = calculateExactMatches(userIngredients, recipeIngredients);
    
    // All 3 user ingredients should match 3 recipe ingredients
    expect(matches).toBe(3);
    expect(coverage).toBe(0.75); // 3 out of 4 recipe ingredients matched
  });

  it("should handle both new and legacy ingredients", () => {
    // Simulating a mix of old-style canonical ingredients and new custom ingredients
    const userIngredients = ["chicken breast", "thai basil", "fish sauce"];
    const recipeIngredients = ["chicken", "basil", "fish sauce", "rice"];
    
    const coverage = calculateCoverageScore(userIngredients, recipeIngredients);
    const matches = calculateExactMatches(userIngredients, recipeIngredients);
    
    // "chicken breast" matches "chicken", "thai basil" matches "basil", "fish sauce" matches exactly
    expect(matches).toBe(3);
    expect(coverage).toBe(0.75);
  });
});
