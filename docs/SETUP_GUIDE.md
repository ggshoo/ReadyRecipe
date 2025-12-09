# ReadyRecipe Setup Guide

This guide provides comprehensive instructions for setting up, configuring, and running ReadyRecipe locally, as well as reproducing the results and evaluation.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Dependencies Installation](#dependencies-installation)
3. [Environment Configuration](#environment-configuration)
4. [Running the Application](#running-the-application)
5. [Running Tests](#running-tests)
6. [Reproducing Results](#reproducing-results)
7. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Minimum Requirements
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (comes with Node.js)
- **Operating System**: macOS, Linux, or Windows (WSL2 recommended)
- **RAM**: 2GB minimum (4GB+ recommended)
- **Disk Space**: ~500MB for dependencies and project files

### Verify Installation
Check your versions before proceeding:

```bash
node --version    # Should output v18.x.x or higher
npm --version     # Should output v9.x.x or higher
```

If you don't have Node.js installed, download it from [nodejs.org](https://nodejs.org) (LTS version recommended).

---

## Dependencies Installation

### 1. Clone the Repository
If you haven't already cloned the repository:

```bash
git clone <repository-url>
cd ReadyRecipe
```

### 2. Install Project Dependencies

ReadyRecipe uses npm for package management. Install all dependencies with:

```bash
npm install
```

This installs packages listed in `package.json`, including:
- **Next.js 15.5.6** — Full-stack React framework with Server Actions
- **React 19** — UI library
- **TypeScript** — Type-safe JavaScript
- **Tailwind CSS** — Utility-first CSS framework
- **Vitest** — Fast unit testing framework
- **OpenAI SDK** — For semantic embeddings (optional)

### 3. Verify Installation

Test that dependencies installed correctly:

```bash
npm run build
```

If the build succeeds without errors, you're ready to proceed. If you encounter errors, see the [Troubleshooting](#troubleshooting) section.

---

## Environment Configuration

### 1. Create `.env.local` File

Create a `.env.local` file in the project root directory:

```bash
touch .env.local
```

Or on Windows:

```bash
type nul > .env.local
```

### 2. Configure Environment Variables

Open `.env.local` in your text editor and add the following:

```env
# OpenAI API Configuration (optional but recommended for best results)
# Leave blank to use deterministic fallback embeddings
OPENAI_API_KEY=your-openai-api-key-here

# Next.js Configuration
NODE_ENV=development
```

### 3. Obtaining an OpenAI API Key (Optional)

ReadyRecipe works **without an OpenAI API key**, but using one provides better embedding quality.

To get an API key:

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Sign up or log in
3. Navigate to API Keys → Create new secret key
4. Copy the key and paste it into `.env.local`
5. Save the file

**Cost Note**: Using `text-embedding-3-small` is very inexpensive (typically <$1 for thousands of queries). ReadyRecipe uses the API sparingly—only when generating recipes, not on every request.

### 4. Fallback Mode (No API Key)

If you don't provide `OPENAI_API_KEY`, the system automatically uses deterministic hash-based embeddings:

- ✅ App works fully offline
- ✅ No API costs
- ⚠️ Embeddings are less semantically meaningful but still functional
- ✅ Fallback embeddings are deterministic (same input = same embedding every time)

To verify which mode is active, check the server logs when you run `npm run dev`. You'll see either:
- `EMBEDDING_SOURCE=OPENAI` (using OpenAI API)
- `EMBEDDING_SOURCE=FALLBACK (OpenAI error)` (using fallback)

---

## Running the Application

### 1. Start the Development Server

```bash
npm run dev
```

This starts:
- Next.js development server with **Turbopack** for fast builds
- Hot-reload on file changes
- Available at **http://localhost:3000**

### 2. Open in Browser

Once you see `▲ Next.js 15.5.6 ready`, open:

```
http://localhost:3000
```

The app should load with the **Ingredient Selection** page (`/new`).

### 3. Testing the Application Locally

#### Example 1: Common Ingredients (Mirepoix)
1. Select: **Carrot**, **Celery**, **Onion**
2. Click "Generate Recipes"
3. You should see ~10+ recipes with high ingredient match rates (many will be 100% or close to it)

#### Example 2: Asian Fusion
1. Select: **Soy Sauce**, **Ginger**, **Garlic**, **Rice**
2. Click "Generate Recipes"
3. You should see Asian-inspired dishes like stir-fries, fried rice, soups

#### Example 3: Baking
1. Select: **Flour**, **Sugar**, **Eggs**, **Butter**
2. Click "Generate Recipes"
3. You should see baked goods like cakes, cookies, brownies

### 4. Understanding the Results Page

The results page shows for each recipe:

| Column | Meaning |
|--------|---------|
| **Recipe Name** | Name and basic metadata |
| **Overall Score** | Combined weighted score (0-100) |
| **Ingredient Match %** | % of user's ingredients in recipe (35% weight) |
| **Similarity Score** | Embedding cosine similarity (40% weight) |
| **Utilization %** | % of recipe ingredients user has (15% weight) |
| **Exact Matches** | Count of word-boundary matches (10% weight) |
| **Matched/Missing** | Color-coded ingredient list (green = matched, orange = missing) |

### 5. Stopping the Server

Press `Ctrl+C` in the terminal where you ran `npm run dev`.

---

## Running Tests

### 1. Run All Tests

```bash
npm test
```

Expected output:
```
✓ src/__tests__/embeddings.test.ts (4 tests) ~150ms
✓ src/__tests__/sortRecipes.test.ts (5 tests) ~50ms
✓ src/__tests__/utils.test.ts (3 tests) ~30ms
✓ src/__tests__/ingredients.test.ts (2 tests) ~40ms

PASS  4 files passed (~267ms)
```

All tests should **PASS** with a total execution time of ~267ms.

### 2. Run Specific Test File

```bash
npm test -- __tests__/embeddings.test.ts
```

### 3. Run Tests with Coverage Report

```bash
npm test -- --coverage
```

This shows which lines of code are tested and which are not.

### 4. Watch Mode (Auto-Rerun on Changes)

```bash
npm test -- --watch
```

Tests will re-run automatically whenever you modify a test file or source code.

### 5. Test Files Overview

| File | Purpose | Tests |
|------|---------|-------|
| `__tests__/embeddings.test.ts` | Embedding generation and similarity | 4 tests |
| `__tests__/sortRecipes.test.ts` | Recipe filtering and sorting | 5 tests |
| `__tests__/utils.test.ts` | Utility functions | 3 tests |
| `__tests__/ingredients.test.ts` | Ingredient matching | 2 tests |

### 6. Important Note About Test Mocking

All tests use a **mocked OpenAI client**—they don't make real API calls. This ensures:
- ✅ Tests run fast (~267ms total)
- ✅ No API costs
- ✅ Reproducible results every time
- ✅ No network dependency

---

## Reproducing Results

### Overview of Evaluation Methodology

ReadyRecipe's evaluation uses three approaches:

1. **Fixed Test Sets**: Curated ingredient combinations with known expected results
2. **Manual Review**: Human judgment on recipe relevance
3. **Stability Testing**: Repeated runs confirm consistent results

### 1. Fixed Test Set Evaluation

#### Test Set 1: Common Cooking Base (Mirepoix)
**Ingredients**: Carrot, Celery, Onion
**Expected Result**: High-ranking recipes using these vegetables as a base
**How to Reproduce**:
```bash
# 1. Start the app
npm run dev

# 2. Navigate to http://localhost:3000
# 3. Select: Carrot, Celery, Onion
# 4. Click "Generate Recipes"
# 5. Verify: Most recipes show 100% or near-100% ingredient match
# 6. Verify: Top 5 recipes include soups, stews, or sauces (vegetables form the base)
```

#### Test Set 2: Asian Stir-Fry
**Ingredients**: Soy Sauce, Ginger, Garlic, Rice
**Expected Result**: Asian recipes dominate top results
**How to Reproduce**:
```bash
# Select: Soy Sauce, Ginger, Garlic, Rice
# Click "Generate Recipes"
# Verify: Top recipes include fried rice, stir-fries, Asian noodle dishes
# Verify: Scores should be moderate to high (60-85%)
```

#### Test Set 3: Baking Essentials
**Ingredients**: Flour, Sugar, Eggs, Butter
**Expected Result**: Baked goods rank highest
**How to Reproduce**:
```bash
# Select: Flour, Sugar, Eggs, Butter
# Click "Generate Recipes"
# Verify: Top recipes are cakes, cookies, brownies, or other baked items
# Verify: Ingredient match is high (70%+)
```

#### Test Set 4: Single Ingredient
**Ingredients**: Chicken
**Expected Result**: All chicken recipes appear
**How to Reproduce**:
```bash
# Select: Chicken (only)
# Click "Generate Recipes"
# Verify: All results contain chicken
# Verify: Similarity scores vary based on preparation style (grilled vs. soup vs. curry)
```

### 2. Manual Review Checklist

For each recipe result, verify:

- [ ] **Relevance**: Does the recipe make sense for the selected ingredients?
- [ ] **Match Quality**: Are the matched ingredients actually in the recipe?
- [ ] **Ranking**: Does the highest-scored recipe seem most appropriate?
- [ ] **Missing Ingredients**: Are the highlighted missing ingredients reasonable?
- [ ] **Metadata**: Is the cook time and difficulty level reasonable?

### 3. Stability Testing

Test that the system produces consistent results across repeated runs:

```bash
# Run 1: Generate recipes for Carrot, Celery, Onion
# Record the top 3 recipes and scores

# Run 2: Refresh the page and repeat
# The results should be IDENTICAL (same recipes, same scores)

# Run 3: Restart the dev server (Ctrl+C, then npm run dev)
# Generate the same recipes again
# Results should still be IDENTICAL
```

**Why This Matters**: Reproducibility indicates the system isn't dependent on randomness or external factors that would make it unreliable in production.

### 4. Diversity Testing

Test with varied ingredient combinations to identify biases:

#### Mediterranean Cuisine
```
Ingredients: Olive Oil, Tomato, Garlic, Basil
Expected: Italian/Mediterranean recipes rank highly
```

#### Indian Cuisine
```
Ingredients: Turmeric, Cumin, Coconut Milk, Ginger
Expected: Indian/South Asian recipes rank highly
```

#### Mexican Cuisine
```
Ingredients: Chili Pepper, Cumin, Lime, Cilantro
Expected: Mexican recipes rank highly
```

#### Vegetarian Focus
```
Ingredients: Spinach, Mushroom, Tofu, Garlic
Expected: Vegetarian dishes rank highly
```

**What to Look For**:
- Are recipes of different cuisines fairly represented?
- Do dietary preferences (vegetarian, vegan) get respected when relevant?
- Are there any obvious biases (e.g., only English-language recipes)?

### 5. Edge Cases

Test how the system handles edge cases:

#### Empty Selection
```
Ingredients: (none selected)
Expected: System shows message or empty results
Verify: No crashes or errors
```

#### Very Rare Ingredients
```
Ingredients: Saffron, Sumac, Pomegranate Molasses
Expected: Fewer matches, but recipes still appear
Verify: Fallback data and API work correctly
```

#### All Ingredients Match
```
Ingredients: (select all ingredients of a recipe)
Expected: That recipe ranks #1 with 100% match
Verify: Exact matching works
```

---

## Troubleshooting

### Issue: `npm install` fails

**Solution 1**: Clear npm cache and reinstall
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Solution 2**: Check Node.js version
```bash
node --version
# Should be v18.0.0 or higher
```

If you have an older version, download Node.js 18+ from [nodejs.org](https://nodejs.org).

### Issue: `npm run dev` doesn't start

**Solution 1**: Kill any process on port 3000
```bash
# macOS/Linux
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Solution 2**: Try a different port
```bash
npm run dev -- -p 3001
```

### Issue: Tests hang or timeout

**Solution**: This is usually caused by OpenAI client initialization. Verify you're using the latest code with lazy initialization:

```bash
git status
# Should show clean working directory
```

If there are uncommitted changes, the lazy init might not be in place. Re-read the embeddings file:

```bash
npm test
```

### Issue: OpenAI API key not working

**Solution 1**: Verify the key is correct
```bash
# In .env.local, ensure:
OPENAI_API_KEY=sk-...  # (Your actual key)
```

**Solution 2**: Check that the `.env.local` file exists and is readable
```bash
cat .env.local
# Should show your OPENAI_API_KEY
```

**Solution 3**: Restart the dev server
```bash
# Ctrl+C to stop
npm run dev  # Start again
```

### Issue: "Cannot find module" errors

**Solution**: Reinstall dependencies
```bash
rm -rf node_modules
npm install
npm run build
```

### Issue: Port 3000 already in use

See the solution under "npm run dev doesn't start" above.

### Issue: Results page shows "Loading..." forever

**Solution**: This was a critical bug in earlier versions. Verify you're on the latest commit:

```bash
git log --oneline -5
# Should show commit: "fix: update sortRecipes to use ingredientMatchRate field"
```

If you're on an older commit, pull the latest:

```bash
git pull origin main
npm install
npm run dev
```

---

## Development Workflow

### Making Changes to Code

1. **Start the dev server**:
   ```bash
   npm run dev
   ```

2. **Edit files** (e.g., `lib/actions.ts`, `app/results/page.tsx`)

3. **Changes hot-reload automatically**

4. **Test in the browser** at http://localhost:3000

5. **Run tests** in a separate terminal:
   ```bash
   npm test
   ```

### Building for Production

```bash
npm run build
npm start
```

This creates an optimized production build.

### Code Style

- **TypeScript**: Use strict mode (no `any` types without explicit casts)
- **Formatting**: Code is formatted with Prettier (configured in `package.json`)
- **Linting**: ESLint checks for common issues (run via `npm run lint` if available)

---

## Useful Commands Reference

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server (http://localhost:3000) |
| `npm test` | Run all tests |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npm test -- --watch` | Run tests in watch mode |
| `npm test -- --coverage` | Run tests with coverage report |

---

## Additional Resources

- **[Next.js Documentation](https://nextjs.org/docs)** — Framework documentation
- **[TypeScript Handbook](https://www.typescriptlang.org/docs/)** — Type system reference
- **[Tailwind CSS Docs](https://tailwindcss.com/docs)** — CSS framework
- **[OpenAI API Docs](https://platform.openai.com/docs/guides/embeddings)** — Embedding model details
- **[Vitest Documentation](https://vitest.dev/)** — Testing framework

---

## Getting Help

If you encounter issues not covered above:

1. **Check the error message** carefully—it often indicates the problem
2. **Search GitHub Issues** in the repository
3. **Review CODE_DOCUMENTATION.md** for implementation details
4. **Try the troubleshooting steps** in order

---

## Next Steps

Once you've completed setup:

1. ✅ Read **[README.md](./README.md)** for project overview
2. ✅ Read **[CODE_DOCUMENTATION.md](./CODE_DOCUMENTATION.md)** for code structure
3. ✅ Run the app locally: `npm run dev`
4. ✅ Run tests: `npm test`
5. ✅ Reproduce results using the test sets above
6. ✅ Make changes and verify tests still pass

Happy coding! 🍳
