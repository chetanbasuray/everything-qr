# Deployment & CI

## GitHub Actions

The project runs a basic CI workflow to ensure builds and TypeScript checks pass before Vercel deploys.

- Install dependencies with `npm install`
- Run `npm run typecheck`
- Run `npm run build`

## Vercel

Connect the repository to Vercel and set the build command to `npm run build` and output to `dist`.

## Environment

No environment variables are required for the current build.
