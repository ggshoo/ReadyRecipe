"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CANONICAL_INGREDIENTS } from "@/lib/datasets";
import { generateRecipes } from "@/lib/actions";

export default function NewRecipePage() {
  const router = useRouter();
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter ingredients based on search query
  const filteredIngredients = CANONICAL_INGREDIENTS.filter((ingredient) =>
    ingredient.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleIngredient = (ingredient: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(ingredient)
        ? prev.filter((i) => i !== ingredient)
        : [...prev, ingredient]
    );
  };

  const handleGenerateRecipes = async () => {
    if (selectedIngredients.length === 0) {
      alert("Please select at least one ingredient");
      return;
    }

    setIsLoading(true);
    try {
      const results = await generateRecipes(selectedIngredients);
      // Store results in sessionStorage to pass to results page
      sessionStorage.setItem("recipeResults", JSON.stringify(results));
      sessionStorage.setItem("selectedIngredients", JSON.stringify(selectedIngredients));
      router.push("/results");
    } catch (error) {
      console.error("Error generating recipes:", error);
      alert("Failed to generate recipes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Select Your Ingredients</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Choose the ingredients you have available, and we&apos;ll find the best recipes for you
          </p>
        </div>

        {/* Selected Ingredients Summary */}
        {selectedIngredients.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">
              Selected Ingredients ({selectedIngredients.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {selectedIngredients.map((ingredient) => (
                <span
                  key={ingredient}
                  className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm flex items-center gap-2"
                >
                  {ingredient}
                  <button
                    onClick={() => toggleIngredient(ingredient)}
                    className="hover:text-red-200"
                    aria-label={`Remove ${ingredient}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
          />
        </div>

        {/* Ingredient Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
          {filteredIngredients.map((ingredient) => {
            const isSelected = selectedIngredients.includes(ingredient);
            return (
              <button
                key={ingredient}
                onClick={() => toggleIngredient(ingredient)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  isSelected
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 font-semibold"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
                }`}
              >
                {ingredient}
              </button>
            );
          })}
        </div>

        {/* Generate Button */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleGenerateRecipes}
            disabled={isLoading || selectedIngredients.length === 0}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Generating Recipes..." : "Generate Recipes"}
          </button>
          <button
            onClick={() => router.push("/")}
            className="px-8 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
