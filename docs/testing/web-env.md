# Test matrix: web environment and app shell

Module: `apps/web/src/lib/env.ts` (Zod schema over `import.meta.env`) and `src/app/App.tsx`.

## Purpose and public surface

- `envSchema` / `parseEnv`: validate the `VITE_*` variables the browser may read. Anything invalid fails fast with a readable error.
- `env`: the parsed environment, evaluated once on import. The only way app code reads configuration.
- `App`: the empty application shell, a single `main` landmark. Features arrive in later phases.

## Cases

| ID     | Area   | Case                                   | Input / setup                           | Expected                                                           | Level     |
| ------ | ------ | -------------------------------------- | --------------------------------------- | ------------------------------------------------------------------ | --------- |
| WEB-01 | schema | Defaults apply to an empty env         | `{}`                                    | `VITE_API_URL` is `http://localhost:3000`                          | unit      |
| WEB-02 | schema | A valid URL passes through             | `VITE_API_URL=https://api.nabd.example` | parsed value equals the input                                      | unit      |
| WEB-03 | schema | Unknown variables are ignored          | `{ MODE: 'test', VITE_X: '1' }`         | parsed object has only `VITE_API_URL`                              | unit      |
| WEB-04 | parse  | Invalid URL throws a readable error    | `VITE_API_URL=not-a-url`                | message starts with "Invalid environment" and names `VITE_API_URL` | unit      |
| WEB-05 | parse  | Valid input returns the parsed env     | `{ VITE_API_URL: 'http://x.test' }`     | returns `{ VITE_API_URL: 'http://x.test' }`                        | unit      |
| WEB-06 | env    | `env` is parsed from `import.meta.env` | import `env` under test                 | `env.VITE_API_URL` is the default                                  | unit      |
| WEB-07 | app    | The shell renders a main landmark      | render `<App />`                        | `getByRole('main')` is in the document                             | component |

## Coverage target

- 90% global floor (statements, branches, functions, lines). `lib/env.ts` and `app/App.tsx` are expected at 100%.
- Excluded, with reason: `src/main.tsx` (browser bootstrap: mounts React into the page, covered by the Playwright smoke spec), `src/test/**` (test setup) and `*.d.ts` (types only).

## Out of scope

Tokens, theme, i18n, router, query client and the realtime layer are Phase 4. Component state tests (loading, empty, error, offline, RTL, dark) come with the features in Phase 5.
