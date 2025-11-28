"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { CANONICAL_INGREDIENTS } from "@/lib/datasets";

interface Ingredient {
  name: string;
  slug: string;
  isCustom: boolean;
}

interface IngredientAutocompleteProps {
  selectedIngredients: string[];
  onAddIngredient: (ingredient: string) => void;
  onRemoveIngredient: (ingredient: string) => void;
}

export default function IngredientAutocomplete({
  selectedIngredients,
  onAddIngredient,
  onRemoveIngredient,
}: IngredientAutocompleteProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [allIngredients, setAllIngredients] = useState<string[]>(CANONICAL_INGREDIENTS);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Fetch all ingredients on mount
  useEffect(() => {
    async function fetchIngredients() {
      try {
        const response = await fetch("/api/ingredients");
        if (response.ok) {
          const data = await response.json();
          const ingredientNames = data.ingredients.map((ing: Ingredient) => ing.name);
          setAllIngredients(ingredientNames);
        }
      } catch (error) {
        console.error("Failed to fetch ingredients:", error);
        // Fall back to canonical ingredients on error
      }
    }
    fetchIngredients();
  }, []);

  // Filter suggestions based on input, excluding already selected ingredients
  const suggestions = inputValue.trim()
    ? allIngredients.filter(
        (ingredient) =>
          ingredient.toLowerCase().includes(inputValue.toLowerCase()) &&
          !selectedIngredients.some(
            (selected) => selected.toLowerCase() === ingredient.toLowerCase()
          )
      )
    : [];

  // Check if input matches any existing ingredient exactly
  const exactMatch = allIngredients.find(
    (ingredient) => ingredient.toLowerCase() === inputValue.toLowerCase().trim()
  );

  // Determine if we should show "Add new ingredient" option
  const trimmedInput = inputValue.trim();
  const showAddNew =
    trimmedInput.length > 0 &&
    !exactMatch &&
    !selectedIngredients.some(
      (ing) => ing.toLowerCase() === trimmedInput.toLowerCase()
    );

  // Total items in the dropdown (suggestions + optional add new)
  const totalItems = suggestions.length + (showAddNew ? 1 : 0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleSelectSuggestion = useCallback(
    (ingredient: string) => {
      onAddIngredient(ingredient);
      setInputValue("");
      setIsOpen(false);
      setHighlightedIndex(-1);
      inputRef.current?.focus();
    },
    [onAddIngredient]
  );

  const handleAddNewIngredient = useCallback(async () => {
    const newIngredient = inputValue.trim().toLowerCase();
    if (
      newIngredient &&
      !selectedIngredients.some(
        (selected) => selected.toLowerCase() === newIngredient
      )
    ) {
      // Add to backend to persist the new ingredient
      try {
        const response = await fetch("/api/ingredients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newIngredient }),
        });
        if (response.ok) {
          const data = await response.json();
          // Update local list if this is truly a new ingredient
          if (data.ingredient && !allIngredients.includes(data.ingredient.name)) {
            setAllIngredients((prev) => [...prev, data.ingredient.name]);
          }
        }
      } catch (error) {
        console.error("Failed to save ingredient:", error);
        // Continue anyway - ingredient will still work for the session
      }

      onAddIngredient(newIngredient);
      setInputValue("");
      setIsOpen(false);
      setHighlightedIndex(-1);
      inputRef.current?.focus();
    }
  }, [inputValue, selectedIngredients, onAddIngredient, allIngredients]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || totalItems === 0) {
      if (e.key === "Enter" && showAddNew) {
        e.preventDefault();
        handleAddNewIngredient();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < totalItems - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : totalItems - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[highlightedIndex]);
        } else if (highlightedIndex === suggestions.length && showAddNew) {
          handleAddNewIngredient();
        } else if (suggestions.length > 0) {
          handleSelectSuggestion(suggestions[0]);
        } else if (showAddNew) {
          handleAddNewIngredient();
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("li");
      items[highlightedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        listRef.current &&
        !listRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full">
      {/* Selected Ingredients */}
      {selectedIngredients.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
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
                  onClick={() => onRemoveIngredient(ingredient)}
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

      {/* Autocomplete Input */}
      <div
        className="relative"
        role="combobox"
        aria-expanded={isOpen && totalItems > 0}
        aria-haspopup="listbox"
        aria-controls="ingredient-suggestions"
      >
        <input
          ref={inputRef}
          type="text"
          placeholder="Type to search or add ingredients..."
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue.trim() && setIsOpen(true)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-lg"
          aria-label="Search or add ingredients"
          aria-autocomplete="list"
        />

        {/* Suggestions Dropdown */}
        {isOpen && totalItems > 0 && (
          <ul
            ref={listRef}
            id="ingredient-suggestions"
            className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg"
            role="listbox"
          >
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion}
                onClick={() => handleSelectSuggestion(suggestion)}
                className={`px-4 py-2 cursor-pointer transition-colors ${
                  index === highlightedIndex
                    ? "bg-blue-100 dark:bg-blue-900/50"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                role="option"
                aria-selected={index === highlightedIndex}
              >
                {suggestion}
              </li>
            ))}
            {showAddNew && (
              <li
                onClick={handleAddNewIngredient}
                className={`px-4 py-2 cursor-pointer transition-colors border-t border-gray-200 dark:border-gray-600 ${
                  highlightedIndex === suggestions.length
                    ? "bg-green-100 dark:bg-green-900/50"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                role="option"
                aria-selected={highlightedIndex === suggestions.length}
              >
                <span className="text-green-600 dark:text-green-400 font-medium">
                  + Add new ingredient: &quot;{trimmedInput}&quot;
                </span>
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Help Text */}
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Start typing to search ingredients, or add a new one if it&apos;s not in
        the list.
      </p>
    </div>
  );
}
