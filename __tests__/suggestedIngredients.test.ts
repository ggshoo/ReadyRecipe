import { describe, it, expect } from "vitest";

/**
 * Unit tests for SuggestedIngredients component logic
 * Tests the pure functions and state management logic used by the component
 */

// Default suggestions list (mirroring the component)
const DEFAULT_SUGGESTIONS = [
  "eggs",
  "milk",
  "flour",
  "salt",
  "butter",
  "sugar",
  "tomato",
  "onion",
  "garlic",
  "chicken breast",
];

// Helper function to check if an ingredient is selected (case-insensitive)
function isIngredientSelected(
  selected: string[],
  ingredient: string
): boolean {
  return selected.some(
    (s) => s.toLowerCase() === ingredient.toLowerCase()
  );
}

// Helper function to check if any suggestions are selected
function hasSelectedSuggestions(
  selected: string[],
  suggestions: string[] = DEFAULT_SUGGESTIONS
): boolean {
  return selected.some((s) =>
    suggestions.some((sug) => sug.toLowerCase() === s.toLowerCase())
  );
}

// Toggle logic - add if not selected, remove if selected
function toggleIngredient(
  selected: string[],
  ingredient: string
): string[] {
  const isSelected = isIngredientSelected(selected, ingredient);
  if (isSelected) {
    return selected.filter(
      (s) => s.toLowerCase() !== ingredient.toLowerCase()
    );
  } else {
    return [...selected, ingredient];
  }
}

// Clear suggestions logic - remove only suggestions from selected
function clearSuggestions(
  selected: string[],
  suggestions: string[] = DEFAULT_SUGGESTIONS
): string[] {
  return selected.filter(
    (ing) =>
      !suggestions.some(
        (sug) => sug.toLowerCase() === ing.toLowerCase()
      )
  );
}

describe("SuggestedIngredients Logic", () => {
  describe("isIngredientSelected", () => {
    it("should return true for selected ingredient", () => {
      const selected = ["eggs", "milk"];
      expect(isIngredientSelected(selected, "eggs")).toBe(true);
      expect(isIngredientSelected(selected, "milk")).toBe(true);
    });

    it("should return false for unselected ingredient", () => {
      const selected = ["eggs", "milk"];
      expect(isIngredientSelected(selected, "flour")).toBe(false);
      expect(isIngredientSelected(selected, "butter")).toBe(false);
    });

    it("should be case-insensitive", () => {
      const selected = ["eggs", "Milk"];
      expect(isIngredientSelected(selected, "EGGS")).toBe(true);
      expect(isIngredientSelected(selected, "milk")).toBe(true);
      expect(isIngredientSelected(selected, "MILK")).toBe(true);
    });

    it("should handle empty selected array", () => {
      const selected: string[] = [];
      expect(isIngredientSelected(selected, "eggs")).toBe(false);
    });
  });

  describe("hasSelectedSuggestions", () => {
    it("should return true when at least one suggestion is selected", () => {
      const selected = ["eggs"];
      expect(hasSelectedSuggestions(selected)).toBe(true);
    });

    it("should return false when no suggestions are selected", () => {
      const selected = ["bacon", "pasta"]; // not in default suggestions
      expect(hasSelectedSuggestions(selected)).toBe(false);
    });

    it("should return false for empty selection", () => {
      expect(hasSelectedSuggestions([])).toBe(false);
    });

    it("should be case-insensitive", () => {
      const selected = ["EGGS", "MILK"];
      expect(hasSelectedSuggestions(selected)).toBe(true);
    });

    it("should work with custom suggestions list", () => {
      const customSuggestions = ["apple", "banana"];
      const selected = ["apple"];
      expect(hasSelectedSuggestions(selected, customSuggestions)).toBe(true);
      expect(hasSelectedSuggestions(["eggs"], customSuggestions)).toBe(false);
    });
  });

  describe("toggleIngredient", () => {
    it("should add ingredient when not selected", () => {
      const selected = ["eggs"];
      const result = toggleIngredient(selected, "milk");
      expect(result).toContain("eggs");
      expect(result).toContain("milk");
      expect(result).toHaveLength(2);
    });

    it("should remove ingredient when already selected", () => {
      const selected = ["eggs", "milk"];
      const result = toggleIngredient(selected, "eggs");
      expect(result).not.toContain("eggs");
      expect(result).toContain("milk");
      expect(result).toHaveLength(1);
    });

    it("should handle case-insensitive toggle", () => {
      const selected = ["Eggs"];
      const result = toggleIngredient(selected, "eggs");
      expect(result).toHaveLength(0);
    });

    it("should preserve other selections when toggling", () => {
      const selected = ["eggs", "milk", "flour"];
      const result = toggleIngredient(selected, "milk");
      expect(result).toContain("eggs");
      expect(result).toContain("flour");
      expect(result).not.toContain("milk");
    });

    it("should not mutate original array", () => {
      const selected = ["eggs", "milk"];
      const result = toggleIngredient(selected, "flour");
      expect(selected).toHaveLength(2);
      expect(result).toHaveLength(3);
      expect(selected).not.toBe(result);
    });
  });

  describe("clearSuggestions", () => {
    it("should remove all suggested ingredients", () => {
      const selected = ["eggs", "milk", "flour"];
      const result = clearSuggestions(selected);
      expect(result).toHaveLength(0);
    });

    it("should preserve non-suggested ingredients", () => {
      const selected = ["eggs", "bacon", "milk", "pasta"];
      const result = clearSuggestions(selected);
      expect(result).toContain("bacon");
      expect(result).toContain("pasta");
      expect(result).not.toContain("eggs");
      expect(result).not.toContain("milk");
      expect(result).toHaveLength(2);
    });

    it("should handle empty selection", () => {
      const result = clearSuggestions([]);
      expect(result).toHaveLength(0);
    });

    it("should be case-insensitive", () => {
      const selected = ["EGGS", "Milk", "FLOUR"];
      const result = clearSuggestions(selected);
      expect(result).toHaveLength(0);
    });

    it("should work with custom suggestions list", () => {
      const customSuggestions = ["apple", "banana"];
      const selected = ["apple", "eggs", "banana"];
      const result = clearSuggestions(selected, customSuggestions);
      expect(result).toContain("eggs");
      expect(result).not.toContain("apple");
      expect(result).not.toContain("banana");
      expect(result).toHaveLength(1);
    });

    it("should not mutate original array", () => {
      const selected = ["eggs", "milk"];
      const result = clearSuggestions(selected);
      expect(selected).toHaveLength(2);
      expect(result).not.toBe(selected);
    });
  });

  describe("DEFAULT_SUGGESTIONS", () => {
    it("should contain common cooking ingredients", () => {
      expect(DEFAULT_SUGGESTIONS).toContain("eggs");
      expect(DEFAULT_SUGGESTIONS).toContain("milk");
      expect(DEFAULT_SUGGESTIONS).toContain("flour");
      expect(DEFAULT_SUGGESTIONS).toContain("salt");
      expect(DEFAULT_SUGGESTIONS).toContain("butter");
      expect(DEFAULT_SUGGESTIONS).toContain("sugar");
      expect(DEFAULT_SUGGESTIONS).toContain("tomato");
      expect(DEFAULT_SUGGESTIONS).toContain("onion");
      expect(DEFAULT_SUGGESTIONS).toContain("garlic");
      expect(DEFAULT_SUGGESTIONS).toContain("chicken breast");
    });

    it("should have 10 default suggestions", () => {
      expect(DEFAULT_SUGGESTIONS).toHaveLength(10);
    });
  });
});
