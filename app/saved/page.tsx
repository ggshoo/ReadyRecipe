import Link from "next/link";

export default function SavedRecipesPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4">Saved Recipes</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          This feature will be available in a future update!
        </p>
        <div className="p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg mb-8">
          <p className="text-lg mb-4">
            🔜 Coming Soon: Save your favorite recipes and access them anytime
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            This feature will be implemented with user authentication and database storage.
          </p>
        </div>
        <Link
          href="/new"
          className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Find New Recipes
        </Link>
      </div>
    </div>
  );
}
