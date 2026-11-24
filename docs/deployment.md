# Deployment

The web app runs on Vercel and the API on Railway. Both deploy from `main` on GitHub.

|        | URL                                                   |
| ------ | ----------------------------------------------------- |
| Web    | https://nabd-trading.vercel.app                       |
| API    | https://nabdserver-production-5845f39b.up.railway.app |
| Health | `GET /api/health`                                     |

## Vercel (web)

- **Root Directory:** `apps/web`. Build, output and routing come from `apps/web/vercel.json`: the build runs from the repository root with Turborepo (the shared package builds first), `dist` is served, every path falls back to `index.html` for the router, and `/assets/*` is cached for a year (the file names are hashed).
- **Environment:** `VITE_API_URL` is the API's full URL with `https://` and no trailing slash. Vite bakes it into the bundle at build time, so changing it needs a redeploy. It is declared on the Turborepo build task, so a changed value never reuses a cached build. The app checks it on start: a value without `https://` makes the page blank, with `Invalid environment ... VITE_API_URL` in the console.

## Railway (API)

- **Build command:** `pnpm turbo run build --filter=@nabd/server`. Railway's default (`pnpm --filter @nabd/server build`) skips Turborepo, so the shared package is never built and the compile fails with `Cannot find module '@nabd/shared'`.
- **Start command:** the default, `pnpm --filter @nabd/server start` (`node dist/main.js`). Root Directory stays `/`.
- **Healthcheck path:** `/api/health`.
- **Variables:** `NODE_ENV=production`, and `CORS_ORIGIN` set to the web URL (`https://nabd-trading.vercel.app`, no trailing slash). Railway provides `PORT`.
- Railway's config file (`railway.json`) is marked deprecated in its docs, so these live in the service settings and are recorded here.

## Things to know

- **One replica only.** The watchlist (ADR 0003) and the market simulation live in the server's memory. A second replica would show different prices, and a restart or redeploy empties every watchlist.
- **One web origin.** `CORS_ORIGIN` takes a single URL. Vercel preview deployments (other URLs) are blocked by CORS; only the production domain works against the API.
- The same E2E suite that runs in CI also passed against these URLs (38 of 38), run by pointing Playwright's `baseURL` at the web URL with no local servers.
