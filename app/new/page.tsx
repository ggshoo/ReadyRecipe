"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateRecipes } from "@/lib/actions";
import IngredientAutocomplete from "@/app/components/IngredientAutocomplete";

export default function NewRecipePage() {
  const router = useRouter();
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddIngredient = (ingredient: string) => {
    if (!selectedIngredients.includes(ingredient)) {
      setSelectedIngredients((prev) => [...prev, ingredient]);
    }
  };

  const handleRemoveIngredient = (ingredient: string) => {
    setSelectedIngredients((prev) => prev.filter((i) => i !== ingredient));
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
            Type to search and add ingredients you have available, and we&apos;ll find the best recipes for you
          </p>
        </div>

        {/* Ingredient Autocomplete */}
        <div className="mb-8">
          <IngredientAutocomplete
            selectedIngredients={selectedIngredients}
            onAddIngredient={handleAddIngredient}
            onRemoveIngredient={handleRemoveIngredient}
          />
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
