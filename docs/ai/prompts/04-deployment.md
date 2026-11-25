# Deploying

> **Adapted from the original conversation.** The original was two short messages and two pasted artifacts (a Railway build log and a screenshot of a blank page). The artifacts are summarized.

- "We want to deploy the frontend on Vercel and the backend on Railway. There is an account for both platforms using GitHub."
- The Railway project created from the repo failed to build. The log ended with `Cannot find module '@nabd/shared'`: the default build command skipped Turborepo, so the shared package was never built.
- After the Vercel deploy the site showed only a blank dark-green page. The browser console said `Invalid environment ... VITE_API_URL`: the variable had been entered without `https://`.

Result: `apps/web/vercel.json`, `docs/deployment.md`, the Turborepo `env` entry for `VITE_API_URL`, and the two failures recorded in `../lessons.md`.
