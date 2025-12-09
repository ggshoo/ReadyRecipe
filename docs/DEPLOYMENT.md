# ReadyRecipe MVP Deployment Guide

This guide will help you deploy the ReadyRecipe MVP application.

## Quick Start (Local Development)

### Prerequisites
- Node.js v20 or higher
- pnpm package manager

### Setup Steps

1. **Clone the repository** (if not already done):
   ```bash
   git clone https://github.com/ggshoo/ReadyRecipe.git
   cd ReadyRecipe
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Set up environment variables** (optional for MVP):
   ```bash
   cp .env.example .env.local
   ```
   
   For the MVP, the app works without any API keys using fallback methods. However, for better performance:
   - Add an OpenAI API key for improved recipe matching
   - Add Supabase credentials for future features

4. **Run the development server**:
   ```bash
   pnpm dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for production**:
   ```bash
   pnpm build
   pnpm start
   ```

## Deployment to Vercel (Recommended)

Vercel is the recommended platform for deploying Next.js applications with serverless functions.

### Option 1: Deploy via Vercel Dashboard (Easiest)

1. **Sign up for Vercel**: Go to [vercel.com](https://vercel.com) and sign up/login

2. **Import your repository**:
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will automatically detect Next.js settings

3. **Configure environment variables** (optional):
   - In project settings, add environment variables from `.env.example`
   - `OPENAI_API_KEY` - for better embeddings (optional)
   - Other variables for future features

4. **Deploy**:
   - Click "Deploy"
   - Vercel will build and deploy your app
   - You'll get a URL like `https://readyrecipe-xxx.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```
   
   Follow the prompts to configure your project.

4. **Deploy to production**:
   ```bash
   vercel --prod
   ```

## Deployment to Other Platforms

### Netlify

1. Connect your GitHub repository to Netlify
2. Build command: `pnpm build`
3. Publish directory: `.next`
4. Add environment variables in Netlify dashboard

### Railway

1. Create new project from GitHub repo
2. Railway will auto-detect Next.js
3. Add environment variables in settings
4. Deploy automatically on push

### Docker Deployment

1. **Create Dockerfile**:
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY package.json pnpm-lock.yaml ./
   RUN npm install -g pnpm && pnpm install --frozen-lockfile
   COPY . .
   RUN pnpm build
   EXPOSE 3000
   CMD ["pnpm", "start"]
   ```

2. **Build and run**:
   ```bash
   docker build -t readyrecipe .
   docker run -p 3000:3000 readyrecipe
   ```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | No | OpenAI API key for embeddings (falls back to simple method) |
| `NEXT_PUBLIC_SUPABASE_URL` | No | Supabase project URL (for future features) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Supabase anonymous key (for future features) |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Supabase service role key (for future features) |
| `SPOONACULAR_API_KEY` | No | Recipe API key (for expanded recipe database) |

## Testing the Deployment

After deployment, test the following features:

1. **Home Page**: Should load with welcome message and "Get Started" button
2. **Ingredient Selection** (`/new`): 
   - Select multiple ingredients from the grid
   - Search for ingredients
   - Generate recipes button should work
3. **Results Page** (`/results`): 
   - Should show ranked recipes based on your selections
   - Display match percentages and missing ingredients
   - Show cooking instructions when expanded
4. **Saved Recipes** (`/saved`): Should show placeholder for future feature

## Troubleshooting

### Build Errors

If you encounter build errors:
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
pnpm install

# Try building again
pnpm build
```

### Environment Variable Issues

- Ensure `NEXT_PUBLIC_*` variables are set if using client-side features
- Restart dev server after changing `.env.local`
- For production, ensure variables are set in your hosting platform's dashboard

### Performance Issues

Without an OpenAI API key, the app uses a fallback embedding method which is slower. For production:
- Add an `OPENAI_API_KEY` for better performance
- Consider implementing caching for recipe embeddings

## Post-Deployment Checklist

- [ ] Home page loads correctly
- [ ] Ingredient selection works
- [ ] Recipe generation returns results
- [ ] Results page displays properly
- [ ] Responsive design works on mobile
- [ ] All navigation links work
- [ ] No console errors in browser

## Next Steps

After successful MVP deployment:

1. **Add Analytics**: Integrate Vercel Analytics or Google Analytics
2. **Implement Auth**: Add Supabase authentication for user accounts
3. **Database Integration**: Connect to Supabase for saved recipes
4. **Expand Recipe Database**: Integrate Spoonacular or other recipe APIs
5. **Vector Database**: Migrate to pgvector for scalable similarity search
6. **Add Tests**: Implement unit tests with Vitest and E2E tests with Playwright

## Support

For issues or questions:
- Check the main README.md
- Review Next.js documentation: https://nextjs.org/docs
- Check Vercel documentation: https://vercel.com/docs

## License

This project is available under the MIT License.
