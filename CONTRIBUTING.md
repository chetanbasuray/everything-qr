# Contributing

Thanks for taking a look at QR Studio.

## How to help

- Review the roadmap in `docs/ROADMAP.md` and pick an item to implement.
- Open a GitHub issue for the item before you start work.
- Keep docs up to date with any new payloads or tooling changes.

## Development setup

```bash
npm install
npm run dev
```

## Expectations

- Keep the UI responsive and accessible.
- Prefer TypeScript-first additions.
- Update `docs/QR_TYPES.md` if you add a payload.
- Use Conventional Commits (enforced by commitlint + husky).
- Versioning follows Semantic Versioning (SemVer).

## Conventional commits

We enforce the Conventional Commits spec to keep releases and history clean.

Format:
```
type(scope?): short summary
```

Examples:
- `feat: add UTM payload type`
- `fix: handle urls with existing query params`
- `docs: update roadmap milestones`
- `chore: bump dependencies`
