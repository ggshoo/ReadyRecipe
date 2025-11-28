import { describe, it, expect } from "vitest";
import {
  generateIngredientSlug,
  normalizeIngredient,
  ingredientMatches,
} from "../lib/utils";

describe("generateIngredientSlug", () => {
  it("should convert ingredient name to lowercase", () => {
    expect(generateIngredientSlug("Chicken Breast")).toBe("chicken-breast");
    expect(generateIngredientSlug("GARLIC")).toBe("garlic");
  });

  it("should trim whitespace", () => {
    expect(generateIngredientSlug("  onion  ")).toBe("onion");
    expect(generateIngredientSlug("  bell pepper  ")).toBe("bell-pepper");
  });

  it("should replace spaces with hyphens", () => {
    expect(generateIngredientSlug("olive oil")).toBe("olive-oil");
    expect(generateIngredientSlug("sour cream")).toBe("sour-cream");
  });

  it("should handle multiple spaces", () => {
    expect(generateIngredientSlug("bell   pepper")).toBe("bell-pepper");
  });

  it("should remove special characters", () => {
    expect(generateIngredientSlug("bell@pepper!")).toBe("bellpepper");
    expect(generateIngredientSlug("honey & mustard")).toBe("honey-mustard");
  });

  it("should remove leading and trailing hyphens", () => {
    expect(generateIngredientSlug("-honey-")).toBe("honey");
    expect(generateIngredientSlug("---garlic---")).toBe("garlic");
    expect(generateIngredientSlug("@olive oil!")).toBe("olive-oil");
  });

  it("should handle empty strings", () => {
    expect(generateIngredientSlug("")).toBe("");
    expect(generateIngredientSlug("   ")).toBe("");
  });
});

describe("normalizeIngredient", () => {
  it("should convert to lowercase and trim", () => {
    expect(normalizeIngredient("  Chicken Breast  ")).toBe("chicken breast");
    expect(normalizeIngredient("GARLIC")).toBe("garlic");
    expect(normalizeIngredient("olive oil")).toBe("olive oil");
  });

  it("should handle empty strings", () => {
    expect(normalizeIngredient("")).toBe("");
    expect(normalizeIngredient("   ")).toBe("");
  });
});

describe("ingredientMatches", () => {
  describe("case-insensitive matching", () => {
    it("should match exact ingredients regardless of case", () => {
      expect(ingredientMatches("chicken", "Chicken")).toBe(true);
      expect(ingredientMatches("GARLIC", "garlic")).toBe(true);
      expect(ingredientMatches("Olive Oil", "olive oil")).toBe(true);
    });
  });

  describe("partial matching", () => {
    it("should match when user ingredient is contained in recipe ingredient", () => {
      expect(ingredientMatches("cauliflower", "Cauliflower Rice")).toBe(true);
      expect(ingredientMatches("chicken", "chicken breast")).toBe(true);
      expect(ingredientMatches("pepper", "bell pepper")).toBe(true);
    });

    it("should match when recipe ingredient is contained in user ingredient", () => {
      expect(ingredientMatches("Cauliflower Rice", "cauliflower")).toBe(true);
      expect(ingredientMatches("chicken breast", "chicken")).toBe(true);
      expect(ingredientMatches("bell pepper", "pepper")).toBe(true);
    });

    it("should match compound ingredients", () => {
      expect(ingredientMatches("green", "green beans")).toBe(true);
      expect(ingredientMatches("sour", "sour cream")).toBe(true);
      expect(ingredientMatches("olive", "olive oil")).toBe(true);
    });
  });

  describe("non-matching cases", () => {
    it("should not match completely different ingredients", () => {
      expect(ingredientMatches("chicken", "beef")).toBe(false);
      expect(ingredientMatches("onion", "garlic")).toBe(false);
      expect(ingredientMatches("milk", "cheese")).toBe(false);
    });

    it("should not match when there is no substring relationship", () => {
      expect(ingredientMatches("rice", "beans")).toBe(false);
      expect(ingredientMatches("tomato", "potato")).toBe(false);
    });
  });

  describe("whitespace handling", () => {
    it("should handle leading and trailing whitespace", () => {
      expect(ingredientMatches("  chicken  ", "chicken breast")).toBe(true);
      expect(ingredientMatches("garlic", "  garlic  ")).toBe(true);
    });
  });
});
