# Media Log

A media log app for tracking movies, TV series, books, and albums. Built with React + TypeScript + Vite.

## Movie / TV Series Data (TMDB)

The app uses [The Movie Database (TMDB) API](https://www.themoviedb.org/documentation/api) for:

- **Trending**: Weekly trending movies and TV shows on the home screen
- **Search**: Search movies and TV series when adding entries

### Setup

1. Create a free account at [themoviedb.org](https://www.themoviedb.org/signup)
2. Go to [API Settings](https://www.themoviedb.org/settings/api) and request an API key
3. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
4. Add your API key to `.env`:
   ```
   VITE_TMDB_API_KEY=your_api_key_here
   ```
5. Restart the dev server

Without `VITE_TMDB_API_KEY`, the screen category will show fallback curated suggestions and search will return no results.

## Deploy (GitHub + Vercel)

This repo is set up with **GitHub** and **Vercel**: pushing to `main` triggers a new deployment.

- **Repository**: [github.com/alsionli/medialog](https://github.com/alsionli/medialog)
- **Vercel**: open [vercel.com/dashboard](https://vercel.com/dashboard) → your linked project → **Deployments** / **Domains** for the live URL.

### Build settings (Vite)

Vercel usually auto-detects these; if you ever need to set them manually:

| Setting            | Value           |
| ------------------ | --------------- |
| Framework Preset   | Vite            |
| Build Command      | `npm run build` |
| Output Directory   | `dist`          |

### Environment variables on Vercel

Add **`VITE_TMDB_API_KEY`** under **Project → Settings → Environment Variables** (Production, and Preview if you want movie search there too). **Redeploy** after changing env vars — Vite embeds this at build time.

### Push changes

```bash
git add .
git commit -m "your message"
git push origin main
```

### Optional: Vercel CLI

From this folder, you can also run `npx vercel` / `npx vercel --prod` or manage env with `npx vercel env add VITE_TMDB_API_KEY` — useful for previews without pushing.

**Monorepo note:** if this app lives in a subfolder of the Git repo, set **Root Directory** to that folder (e.g. `media-log-app`) in the Vercel project settings.

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
