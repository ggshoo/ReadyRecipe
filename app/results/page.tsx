"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RecipeScore } from "@/lib/actions";
import { filterAndSortRecipeScores } from "@/lib/sortRecipes";

export default function ResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<RecipeScore[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);

  useEffect(() => {
    // Retrieve results from sessionStorage
    const storedResults = sessionStorage.getItem("recipeResults");
    const storedIngredients = sessionStorage.getItem("selectedIngredients");

    if (storedResults && storedIngredients) {
      const parsedResults: RecipeScore[] = JSON.parse(storedResults);
      // Filter out recipes with 0% match and sort by match percentage (highest first)
      const filteredAndSorted = filterAndSortRecipeScores(parsedResults);
      setResults(filteredAndSorted);
      setSelectedIngredients(JSON.parse(storedIngredients));
    } else {
      // No results found, redirect to ingredient selection
      router.push("/new");
    }
  }, [router]);

  const toggleRecipeExpansion = (recipeId: string) => {
    setExpandedRecipe(expandedRecipe === recipeId ? null : recipeId);
  };

  if (results.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Your Recipe Recommendations</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Based on your selected ingredients: {selectedIngredients.join(", ")}
          </p>
          <Link
            href="/new"
            className="text-blue-600 hover:underline"
          >
            ← Try different ingredients
          </Link>
        </div>

        {/* Results Grid */}
        <div className="space-y-6">
          {results.map((result, index) => {
            const isExpanded = expandedRecipe === result.recipe.id;
            const matchPercentage = Math.round(result.coverageScore * 100);

            return (
              <div
                key={result.recipe.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                {/* Recipe Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl font-bold text-blue-600">
                        #{index + 1}
                      </span>
                      <h2 className="text-2xl font-bold">{result.recipe.name}</h2>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <span>⏱️ {result.recipe.cookTime} minutes</span>
                      <span>🍽️ {result.recipe.servings} servings</span>
                      {result.recipe.cuisine && (
                        <span>🌍 {result.recipe.cuisine}</span>
                      )}
                      {result.recipe.difficulty && (
                        <span>
                          📊{" "}
                          {result.recipe.difficulty.charAt(0).toUpperCase() +
                            result.recipe.difficulty.slice(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600">
                      {matchPercentage}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      match
                    </div>
                  </div>
                </div>

                {/* Ingredient Match Details */}
                <div className="mb-4">
                  <div className="mb-2">
                    <span className="font-semibold text-green-600">
                      ✓ You have ({result.matchedIngredients.length}):
                    </span>{" "}
                    <span className="text-gray-700 dark:text-gray-300">
                      {result.matchedIngredients.join(", ")}
                    </span>
                  </div>
                  {result.missingIngredients.length > 0 && (
                    <div>
                      <span className="font-semibold text-orange-600">
                        ⚠ You&apos;ll need ({result.missingIngredients.length}):
                      </span>{" "}
                      <span className="text-gray-700 dark:text-gray-300">
                        {result.missingIngredients.join(", ")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Score Details */}
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600 dark:text-gray-400">
                        Coverage Score
                      </div>
                      <div className="font-semibold">
                        {(result.coverageScore * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600 dark:text-gray-400">
                        Similarity Score
                      </div>
                      <div className="font-semibold">
                        {(result.similarityScore * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600 dark:text-gray-400">
                        Exact Matches
                      </div>
                      <div className="font-semibold">{result.exactMatches}</div>
                    </div>
                  </div>
                </div>

                {/* Toggle Instructions */}
                <button
                  onClick={() => toggleRecipeExpansion(result.recipe.id)}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  {isExpanded ? "Hide Instructions ▲" : "Show Instructions ▼"}
                </button>

                {/* Cooking Instructions */}
                {isExpanded && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h3 className="font-semibold mb-3 text-lg">
                      Cooking Instructions:
                    </h3>
                    <ol className="list-decimal list-inside space-y-2">
                      {result.recipe.instructions.map((instruction, idx) => (
                        <li key={idx} className="text-gray-700 dark:text-gray-300">
                          {instruction}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Link
            href="/new"
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Try Different Ingredients
          </Link>
        </div>
      </div>
    </div>
  );
}
