import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-8 items-center text-center max-w-2xl">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          ReadyRecipe
        </h1>
        <p className="text-xl text-gray-700 dark:text-gray-300">
          Turn the ingredients you already have into delicious meal ideas
        </p>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Reduce food waste, minimize meal planning stress, and discover healthy recipes based on what&apos;s in your kitchen.
        </p>
        
        <div className="flex gap-4 items-center flex-col sm:flex-row mt-8">
          <Link
            href="/new"
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-blue-600 text-white gap-2 hover:bg-blue-700 text-lg h-12 px-8"
          >
            Get Started
          </Link>
          <Link
            href="/saved"
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-lg h-12 px-8"
          >
            View Saved Recipes
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">🥕 Select Ingredients</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Choose from a list of common ingredients you have at home
            </p>
          </div>
          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">🤖 AI-Powered Matching</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Our AI finds the best recipe matches using semantic similarity
            </p>
          </div>
          <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">🍳 Cook with Confidence</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Get ranked recipes with cooking times and detailed instructions
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
