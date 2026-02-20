# HAAK Setup

## Standard runtime
- Node: `20.x`
- npm: `10.x`

This repo enforces versions via `engines` + `.npmrc` (`engine-strict=true`).

## Install (all)
```bash
npm run install:all
```

## Run
```bash
npm run dev:backend
npm run dev:frontend
```

## Fresh install rule
Always use `npm ci` (not `npm install`) for reproducible installs.
