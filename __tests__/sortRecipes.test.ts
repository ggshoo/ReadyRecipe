import { describe, it, expect } from "vitest";
import { filterAndSortRecipes } from "../src/utils/sortRecipes";

describe("filterAndSortRecipes", () => {
  describe("input validation", () => {
    it("should return empty array for null input", () => {
      expect(filterAndSortRecipes(null)).toEqual([]);
    });

    it("should return empty array for undefined input", () => {
      expect(filterAndSortRecipes(undefined)).toEqual([]);
    });

    it("should return empty array for empty array input", () => {
      expect(filterAndSortRecipes([])).toEqual([]);
    });
  });

  describe("parsing percentage string formats", () => {
    it("should parse '85%' format", () => {
      const recipes = [{ match: "85%" }, { match: "50%" }];
      const result = filterAndSortRecipes(recipes);
      expect(result).toHaveLength(2);
      expect(result[0].match).toBe("85%");
      expect(result[1].match).toBe("50%");
    });

    it("should parse '0.85%' format (treated as 0.85%)", () => {
      const recipes = [{ match: "0.85%" }];
      const result = filterAndSortRecipes(recipes);
      expect(result).toHaveLength(1);
    });
  });

  describe("parsing numeric string formats", () => {
    it("should parse '85' string format as 85%", () => {
      const recipes = [{ match: "85" }, { match: "50" }];
      const result = filterAndSortRecipes(recipes);
      expect(result).toHaveLength(2);
      expect(result[0].match).toBe("85");
      expect(result[1].match).toBe("50");
    });

    it("should parse '0.85' string format as 85%", () => {
      const recipes = [{ match: "0.85" }, { match: "0.50" }];
      const result = filterAndSortRecipes(recipes);
      expect(result).toHaveLength(2);
      expect(result[0].match).toBe("0.85"); // 0.85 -> 85%
      expect(result[1].match).toBe("0.50"); // 0.50 -> 50%
    });
  });

  describe("parsing numeric formats", () => {
    it("should parse integer format (85 -> 85%)", () => {
      const recipes = [{ match: 85 }, { match: 50 }];
      const result = filterAndSortRecipes(recipes);
      expect(result).toHaveLength(2);
      expect(result[0].match).toBe(85);
      expect(result[1].match).toBe(50);
    });

    it("should parse decimal format in (0,1] as fraction (0.85 -> 85%)", () => {
      const recipes = [{ match: 0.85 }, { match: 0.50 }];
      const result = filterAndSortRecipes(recipes);
      expect(result).toHaveLength(2);
      expect(result[0].match).toBe(0.85); // 0.85 -> 85%
      expect(result[1].match).toBe(0.50); // 0.50 -> 50%
    });

    it("should handle edge case of exactly 1 as fraction (1 -> 100%)", () => {
      const recipes = [{ match: 1 }];
      const result = filterAndSortRecipes(recipes);
      expect(result).toHaveLength(1);
    });

    it("should handle values greater than 1 as percentages", () => {
      const recipes = [{ match: 100 }, { match: 1.5 }];
      const result = filterAndSortRecipes(recipes);
      expect(result).toHaveLength(2);
      expect(result[0].match).toBe(100); // 100%
      expect(result[1].match).toBe(1.5); // 1.5%
    });
  });

  describe("handling null/undefined match values", () => {
    it("should treat null match as 0 and filter out", () => {
      const recipes = [{ match: null }, { match: 50 }];
      const result = filterAndSortRecipes(recipes);
      expect(result).toHaveLength(1);
      expect(result[0].match).toBe(50);
    });

    it("should treat undefined match as 0 and filter out", () => {
      const recipes = [{ match: undefined }, { match: 50 }];
      const result = filterAndSortRecipes(recipes);
      expect(result).toHaveLength(1);
      expect(result[0].match).toBe(50);
    });

    it("should treat missing match property as 0 and filter out", () => {
      const recipes = [{}, { match: 50 }];
      const result = filterAndSortRecipes(recipes);
      expect(result).toHaveLength(1);
      expect(result[0].match).toBe(50);
    });
  });

  describe("handling unparseable values", () => {
    it("should treat unparseable strings as 0 and filter out", () => {
      const recipes = [{ match: "invalid" }, { match: 50 }];
      const result = filterAndSortRecipes(recipes);
      expect(result).toHaveLength(1);
      expect(result[0].match).toBe(50);
    });

    it("should treat NaN as 0 and filter out", () => {
      const recipes = [{ match: NaN }, { match: 50 }];
      const result = filterAndSortRecipes(recipes);
      expect(result).toHaveLength(1);
      expect(result[0].match).toBe(50);
    });

    it("should treat Infinity as 0 and filter out", () => {
      const recipes = [{ match: Infinity }, { match: 50 }];
      const result = filterAndSortRecipes(recipes);
      expect(result).toHaveLength(1);
      expect(result[0].match).toBe(50);
    });
  });

  describe("filtering behavior", () => {
    it("should filter out recipes with match <= 0", () => {
      const recipes = [{ match: 0 }, { match: -5 }, { match: 50 }];
      const result = filterAndSortRecipes(recipes);
      expect(result).toHaveLength(1);
      expect(result[0].match).toBe(50);
    });

    it("should filter out recipes with 0%", () => {
      const recipes = [{ match: "0%" }, { match: "50%" }];
      const result = filterAndSortRecipes(recipes);
      expect(result).toHaveLength(1);
      expect(result[0].match).toBe("50%");
    });
  });

  describe("sorting behavior", () => {
    it("should sort recipes by match percentage descending", () => {
      const recipes = [
        { name: "C", match: 30 },
        { name: "A", match: 90 },
        { name: "B", match: 60 },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result.map((r) => r.name)).toEqual(["A", "B", "C"]);
    });

    it("should maintain stable order for equal match values", () => {
      const recipes = [
        { name: "A", match: 50 },
        { name: "B", match: 50 },
        { name: "C", match: 50 },
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result).toHaveLength(3);
    });

    it("should handle mixed formats correctly when sorting", () => {
      const recipes = [
        { name: "A", match: "30%" }, // 30%
        { name: "B", match: 0.9 }, // 90%
        { name: "C", match: 60 }, // 60%
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result.map((r) => r.name)).toEqual(["B", "C", "A"]);
    });
  });

  describe("immutability", () => {
    it("should not mutate the original array", () => {
      const recipes = [{ match: 30 }, { match: 90 }, { match: 60 }];
      const originalRecipes = [...recipes];
      filterAndSortRecipes(recipes);
      expect(recipes).toEqual(originalRecipes);
    });

    it("should not mutate original recipe objects", () => {
      const recipe1 = { name: "A", match: 50 };
      const recipe2 = { name: "B", match: 80 };
      const recipes = [recipe1, recipe2];

      const result = filterAndSortRecipes(recipes);

      // Original objects should be unchanged
      expect(recipe1.name).toBe("A");
      expect(recipe1.match).toBe(50);
      expect(recipe2.name).toBe("B");
      expect(recipe2.match).toBe(80);

      // Result should contain the same objects (shallow copy)
      expect(result[0]).toBe(recipe2);
      expect(result[1]).toBe(recipe1);
    });
  });

  describe("coverageScore property support", () => {
    it("should use coverageScore if match is not present", () => {
      const recipes = [
        { name: "A", coverageScore: 0.5 }, // 50%
        { name: "B", coverageScore: 0.8 }, // 80%
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result.map((r) => r.name)).toEqual(["B", "A"]);
    });

    it("should prefer match over coverageScore if both present", () => {
      const recipes = [
        { name: "A", match: 90, coverageScore: 0.5 }, // uses 90%
        { name: "B", match: 30, coverageScore: 0.8 }, // uses 30%
      ];
      const result = filterAndSortRecipes(recipes);
      expect(result.map((r) => r.name)).toEqual(["A", "B"]);
    });
  });
});
