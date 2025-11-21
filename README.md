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
- Ingredient selection UI based on a predefined canonical list.
- Backend "generateRecipes" Server Action that:
  - Filters candidate recipes by dietary constraints (where applicable).
  - Encodes user-selected ingredients and candidate recipes into embeddings.
  - Computes similarity scores (cosine similarity) and applies a lightweight coverage/heuristic score for ranking.
- Results page showing ranked recipes with ingredient match highlights and simple metadata (time, servings).
- Local/in-memory vector similarity during MVP; optional transition to pgvector/Supabase later.

## Motivation
Our team — Cathryn Xu, Gigi Hsu, and Kristen De Lancey — are busy grad students who want a practical tool to suggest healthy, convenient meals from what they already have. We also wanted to explore constraint-satisfaction and embedding-based similarity in a scoped, deliverable project.

## Tech stack
- Frontend: Next.js 15 (App Router), React 19, TypeScript
- Styling: Tailwind CSS, shadcn/ui
- Backend: Next.js Server Actions (serverless)
- Database & Auth: Supabase (PostgreSQL, optional storage & auth)
- Recipe data: Third-party APIs (e.g., Spoonacular, Edamam) or local dataset for MVP
- AI: Pre-trained open-source embedding model (e.g., Sentence Transformers / GTE variants)
- Vector store (post-MVP): Supabase pgvector
- Dev tools: pnpm, ESLint, Vitest, Playwright
- Deployment: Vercel (recommended for serverless + edge)

## Architecture & data flow
1. User selects ingredients in the Next.js frontend.
2. Frontend calls a server action (generateRecipes).
3. generateRecipes:
   - Normalizes/expands selected ingredients against the canonical ingredient list.
   - Queries recipe data source(s) to gather candidate recipes.
   - Encodes user ingredient list and each recipe ingredient list with the chosen embedding model.
   - Computes cosine similarities and applies a coverage heuristic (e.g., matched ingredient fraction).
   - Returns a ranked list of recipes with scoring metadata.
4. Frontend renders results and allows saving favorite recipes (post-MVP: saved recipes backed by Supabase).

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
Prerequisites:
- Node.js (v20+ recommended)
- pnpm
- Access to any required API keys (Spoonacular, Supabase, etc.) — see Environment Variables below

Install dependencies:
pnpm install

Run in development:
pnpm dev
- The app should be available at http://localhost:3000 by default (Next.js default).

Build for production:
pnpm build
pnpm start

## Environment variables
Create a .env.local at the project root and provide the following variables (names may vary depending on implementation):

- NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
- SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (server use only)
- NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
- SPOONACULAR_API_KEY=your-spoonacular-or-recipe-api-key
- EMBEDDING_MODEL=identifier-or-config-for-chosen-embedding-model
- OPENAI_API_KEY (only if using an OpenAI-based embeddings route — optional)

Notes:
- Keep secret keys out of version control. Use secret management for deployments (Vercel/Supabase dashboards).

## Testing
- Unit tests: Vitest
- End-to-end: Playwright
Run tests:
pnpm test
pnpm test:e2e

(Actual test scripts depend on the test setup in package.json.)

## Future work (post-MVP)
- Image-to-ingredient extraction (OCR + classifier).
- User accounts, saved recipes, personalized preferences (Supabase Auth + DB).
- pgvector integration for scalable vector similarity search.
- Optional personalization filters: dietary restrictions, complexity, prep time, cuisine preference.
- Integration with grocery services (e.g., Instacart) for shopping lists / monetization.

## Contributing
We welcome contributions that align with the project vision. For small changes:
- Fork the repo, create a branch, and open a pull request describing your change.
- Follow existing code style: TypeScript strict mode, ESLint, and Tailwind design tokens.

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
