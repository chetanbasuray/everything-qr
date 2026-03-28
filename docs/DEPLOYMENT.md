# Deployment & CI

## GitHub Actions

The project runs a basic CI workflow to ensure builds and TypeScript checks pass before Vercel deploys.

- Install dependencies with `npm install`
- Run `npm run typecheck`
- Run `npm run build`

## Auto versioning

Merges to `main` trigger Release Please, which opens release PRs based on conventional commit messages. When the release PR is merged, it tags a version and updates `package.json`.

## Vercel

Connect the repository to Vercel and set the build command to `npm run build` and output to `dist`.

## Environment

No environment variables are required for the current build.
