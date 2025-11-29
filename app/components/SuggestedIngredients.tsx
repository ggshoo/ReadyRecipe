"use client";

interface SuggestedIngredientsProps {
  suggestions?: string[];
  selected: string[];
  onToggle: (ingredient: string) => void;
  onClearAll: () => void;
}

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

export default function SuggestedIngredients({
  suggestions = DEFAULT_SUGGESTIONS,
  selected,
  onToggle,
  onClearAll,
}: SuggestedIngredientsProps) {
  const hasSelected = selected.some((s) =>
    suggestions.some((sug) => sug.toLowerCase() === s.toLowerCase())
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          Quick Add Ingredients
        </h3>
        {hasSelected && (
          <button
            onClick={onClearAll}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            aria-label="Clear all selected suggestions"
          >
            Clear suggestions
          </button>
        )}
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Suggested ingredients"
      >
        {suggestions.map((ingredient) => {
          const isSelected = selected.some(
            (s) => s.toLowerCase() === ingredient.toLowerCase()
          );
          return (
            <button
              key={ingredient}
              onClick={() => onToggle(ingredient)}
              aria-pressed={isSelected}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                isSelected
                  ? "bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-gray-900"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600"
              }`}
            >
              {isSelected && (
                <span className="mr-1" aria-hidden="true">
                  ✓
                </span>
              )}
              {ingredient}
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Click to quickly add common ingredients, or use the search box below for
        more options.
      </p>
    </div>
  );
}
