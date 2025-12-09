# ReadyRecipe

ReadyRecipe is a recipe recommendation web app that helps users turn the ingredients they already have into meal ideas. Built as a semester final project, ReadyRecipe focuses on reducing the cognitive load of meal planning, minimizing food waste, and suggesting healthy meals using a lightweight AI-driven similarity approach.

This repository contains the code, design notes, and resources for the MVP: a web app where users select ingredients from a canonical list and receive ranked recipe recommendations from a structured recipe dataset/APIs.

## Table of contents
- Project overview
- MVP features
- Motivation
- Tech stack
- Architecture & data flow
- Evaluation plan
- Project timeline
- Local development & setup
- Environment variables
- Testing
- Future work
- Contributors
- License

## Project overview
ReadyRecipe takes a user's selected ingredients and returns a ranked list of recipes that best match those ingredients. The system prioritizes fast, reliable matching and simple UI/UX for an MVP experience. The AI-driven component encodes ingredient lists using a pre-trained embedding model and ranks recipes via semantic similarity combined with simple heuristics.

Primary goals:
- Reduce the mental load of deciding what to cook.
- Reduce food waste by making use of existing ingredients.
- Provide healthy, relevant recipe suggestions quickly.

## MVP features
- Ingredient selection UI based on a predefined canonical list (200+ ingredients).
- Backend "generateRecipes" Server Action that:
  - Fetches recipes from TheMealDB API (with fallback to 64 curated mock recipes).
  - Encodes user-selected ingredients and each recipe's ingredients into embeddings (OpenAI's `text-embedding-3-small` model).
  - Computes four complementary metrics:
    - **Ingredient Match Rate**: % of user-selected ingredients found in recipe (35% weight)
    - **Similarity Score**: Cosine similarity of ingredient embeddings (40% weight)
    - **Utilization Score**: % of recipe ingredients the user has (15% weight)
    - **Exact Matches**: Count of precise word-boundary ingredient matches (10% weight)
  - Ranks recipes by weighted combined score and filters out zero-match recipes.
- Results page showing:
  - Ranked recipes with ingredient match percentage
  - Detailed score breakdown for each metric
  - Which ingredients matched (green) vs. missing (orange)
  - Recipe metadata (cook time, servings, difficulty, cuisine)
  - Expandable cooking instructions
- Graceful degradation: Falls back to deterministic hash-based embeddings if OpenAI API unavailable.

## Motivation
Our team — Cathryn Xu, Gigi Hsu, and Kristen De Lancey — are busy grad students who want a practical tool to suggest healthy, convenient meals from what they already have. We also wanted to explore constraint-satisfaction and embedding-based similarity in a scoped, deliverable project.

## Tech stack
- Frontend: Next.js 15.5.6 (App Router, Turbopack), React 19, TypeScript
- Styling: Tailwind CSS with dark mode support
- Backend: Next.js Server Actions (serverless)
- AI/ML: OpenAI `text-embedding-3-small` for semantic embeddings (with deterministic fallback)
- Recipe data: TheMealDB API + 64 curated mock recipes
- Testing: Vitest with proper mocking of external APIs
- Dev tools: pnpm, TypeScript strict mode, Turbopack
- Deployment: Vercel (recommended for serverless + edge)
- Database & Auth: Supabase (optional, post-MVP)

## Architecture & data flow
1. **User selects ingredients** in the Next.js frontend (`/new` page).
   - Autocomplete from CANONICAL_INGREDIENTS list (200+ curated ingredients)
   - Multi-select with visual feedback
2. **Frontend calls server action** (generateRecipes).
3. **generateRecipes** (lib/actions.ts):
   - Fetches recipes from two sources:
     - TheMealDB API (10 real recipes per search, if available)
     - 64 mock recipes from datasets.ts (fallback + supplementary)
   - Deduplicates by recipe name
   - Generates user embedding: concatenates selected ingredients → passes to OpenAI/fallback
   - For each recipe:
     - Generates recipe embedding: concatenates recipe ingredients
     - Calculates four metrics (see MVP features above)
     - Applies weighted formula: `(similarity × 0.40) + (matchRate × 0.35) + (utilization × 0.15) + (exactMatches × 0.10)`
   - Filters recipes with 0% ingredient match rate
   - Sorts by combined score (highest first)
   - Returns ranked list with detailed scoring metadata
4. **Frontend renders results** (`/results` page):
   - Shows ranked recipes with all scoring details
   - Displays matched vs. missing ingredients
   - Allows expanding instructions
   - (Post-MVP: saving favorite recipes to Supabase)

Example repository layout (intended):
- app/
  - new/           # Ingredient selection + generate recipes flow
  - results/       # Results page
  - saved/         # Saved recipes (post-MVP)
- components/      # Reusable UI components
- lib/
  - ai/            # Embedding + similarity logic
  - actions.ts     # Server Actions including generateRecipes
  - datasets.ts    # Canonical ingredient list + mapping
  - api-clients.ts # Recipe API integrations
  - supabase*.ts   # Supabase client config
- supabase/        # DB schema / migrations
- styles/          # Tailwind + design tokens

## Evaluation plan
- Define fixed ingredient test sets (human-curated) and measure:
  - Response time (end-to-end).
  - Top-k relevance through manual review (does the recommended recipe make sense given the selected ingredient set?).
  - Ranking stability across repeated runs.
- Test with diverse cuisine and dietary inputs to surface dataset biases.
- If image-to-ingredient is pursued later, validate OCR/classifier accuracy; fallback to manual ingredient selection if unreliable.

## Project timeline (summary)
- 11/5–11/14: Planning, repo setup, initial dataset & API selection
- 11/14: Consultation & proposal finalization
- 11/14–11/21: Build MVP prototype with local datasets
- 11/21–12/1: Connect live recipe API, polish UI, create presentation
- 12/1–12/9: Final report, tests, deployment & reflections

## Local development & setup
For detailed setup instructions, see [Setup Guide](./docs/SETUP_GUIDE.md).

Quick start:
```bash
# Install dependencies
npm install

# Run development server
npm run dev
# App available at http://localhost:3000

# Run tests
npm test

# Build for production
npm run build
npm start
```

Prerequisites:
- Node.js v18+ (check with `node --version`)
- npm v9+ (included with Node.js)

## Environment variables
Create a `.env.local` at the project root:

```env
# OpenAI API Configuration (optional)
# If not provided, system uses deterministic hash-based fallback embeddings
OPENAI_API_KEY=your-openai-api-key-here

# Next.js Configuration
NODE_ENV=development
```

**Notes:**
- `OPENAI_API_KEY` is **optional**. System has built-in fallback embeddings for testing without API costs.
- Keep secret keys out of version control. Use secret management for deployments (Vercel environment variables).
- Fallback embeddings use deterministic hash-based approach; results slightly differ from OpenAI but system still functions properly.
- Check server logs for `EMBEDDING_SOURCE=OPENAI` or `EMBEDDING_SOURCE=FALLBACK` to see which is being used.

## Testing
- **Unit tests**: Vitest with proper mocking of OpenAI client
- **Test coverage**:
  - Embeddings generation and similarity calculation
  - Ingredient matching (exact and fuzzy)
  - Recipe scoring and filtering
  - Sorting and ranking logic

Run tests:
```bash
npm test                                    # Run all tests (~267ms)
npm test -- __tests__/embeddings.test.ts   # Run specific test file
npm test -- --coverage                     # Run with coverage report
```

**Note**: Tests use mocked OpenAI client to avoid API calls and ensure reproducibility. All 4 embeddings tests pass consistently.

## Documentation
- **[Setup Guide](./docs/SETUP_GUIDE.md)** — Complete setup, dependencies, configuration, and reproducibility instructions
- **[Code Documentation](./docs/CODE_DOCUMENTATION.md)** — Detailed code walkthrough, algorithm explanations, and testing guide
- **[Deployment](./docs/DEPLOYMENT.md)** — Deployment instructions for Vercel
- **[MVP Summary](./docs/MVP_SUMMARY.md)** — High-level project overview

## Recent improvements (December 2024)
- ✅ Fixed critical bug: Updated `sortRecipes.ts` to use renamed `ingredientMatchRate` field
- ✅ Refactored embeddings module: Removed unused functions, consolidated comments, lazy-initialize OpenAI client
- ✅ Added comprehensive documentation: SETUP_GUIDE.md and CODE_DOCUMENTATION.md
- ✅ All tests passing with 267ms execution time
- ✅ Verified recipe matching works correctly across canonical + API sources

## Future work (post-MVP)
- Image-to-ingredient extraction (OCR + classifier).
- User accounts, saved recipes, personalized preferences (Supabase Auth + DB).
- pgvector integration for scalable vector similarity search.
- Optional personalization filters: dietary restrictions, complexity, prep time, cuisine preference.
- Integration with grocery services (e.g., Instacart) for shopping lists / monetization.
- Individual ingredient-level embeddings for more granular matching.
- Expand mock recipe dataset beyond 64 recipes.

## Contributing
We welcome contributions that align with the project vision. For small changes:
- Fork the repo, create a branch, and open a pull request describing your change.
- Follow existing code style: TypeScript strict mode, ESLint, Tailwind design tokens.
- Ensure tests pass: `npm test`
- See CODE_DOCUMENTATION.md for code structure and patterns.

If you'd like to contribute larger features, open an issue first to discuss design choices and avoid duplicate effort.

## Contributors
- Cathryn Xu — technical implementation, Next.js, Server Actions
- Gigi Hsu — AI & data components, embedding model selection
- Kristen De Lancey — product, user research, presentation & documentation

(Repo owner / maintainers may update this list as appropriate.)

## Acknowledgments
This project was developed as a final project for CPSC 1710. The team reviewed existing products such as DishGen, Strongr Fastr, and others to help shape the MVP.

## License
This project is available under the MIT License. See LICENSE file for details.
