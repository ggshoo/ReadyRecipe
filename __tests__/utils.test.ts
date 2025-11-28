import { describe, it, expect } from "vitest";
import {
  generateIngredientSlug,
  normalizeIngredient,
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
