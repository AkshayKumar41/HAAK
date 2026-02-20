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

## Storage modes
Backend now supports two persistence modes:
- `STORAGE_DRIVER=file` (default): local JSON file (`backend/data/teacher-portal.json`)
- `STORAGE_DRIVER=mysql`: online MySQL (OCI HeatWave) using `DATABASE_URL`
- `STORAGE_DRIVER=postgres`: online PostgreSQL using `DATABASE_URL`

The API routes are unchanged, so frontend behavior stays the same.

## Local/OCI MySQL usage
1. Install backend deps:
```bash
npm --prefix backend ci
npm --prefix backend install mysql2
```

2. Set backend env (`backend/.env`):
```bash
STORAGE_DRIVER=mysql
DATABASE_URL=mysql://appuser:<password>@<host>:3306/<db-name>
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=true
```

3. Optional one-time seed from local JSON:
```bash
npm --prefix backend run seed:mysql
```

4. Start backend:
```bash
npm run dev:backend
```

`GET /health` now returns a `storage` field (`file` or `postgres`).

## OCI deployment runbook
This section assumes you already have a compute instance and VCN (as of February 20, 2026).

1. Create a managed MySQL database in OCI.
- In OCI Console, create a MySQL HeatWave DB system.
- Place it in a private subnet in the same VCN as your app instance.
- Create database/user credentials for this app.

2. Network security setup.
- On the DB subnet/NSG: allow inbound PostgreSQL (`TCP 5432`) only from your app instance subnet/NSG.
- On app subnet/NSG: allow egress to DB on `5432`.
- Keep DB private (no public IP).

3. Install and configure app on compute.
```bash
cd /Users/akskum/code/hackathons/HAAK
npm run install:all
npm --prefix backend install mysql2
cp backend/.env.example backend/.env
```

4. Set backend env for OCI in `backend/.env`.
```bash
PORT=3001
FRONTEND_ORIGIN=http://<your-frontend-host>
STORAGE_DRIVER=mysql
DATABASE_URL=mysql://<user>:<password>@<private-db-host>:3306/<db-name>
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=true

# existing GenAI settings
OCI_GENAI_API_KEY=<your-key>
OCI_REGION=us-chicago-1
OCI_MODEL=meta.llama-3.3-70b-instruct
OCI_LIVE_QUIZ_MODEL=meta.llama-3.3-70b-instruct
```

5. Seed data once (optional).
```bash
npm --prefix backend run seed:mysql
```

6. Start backend.
```bash
npm --prefix backend run start
```

7. Validate.
```bash
curl http://localhost:3001/health
```
Expected JSON includes `"storage":"postgres"`.

## Notes
- If `mysql2` is missing and `STORAGE_DRIVER=mysql`, backend will return a startup error asking to install `mysql2`.
- If `pg` is missing and `STORAGE_DRIVER=postgres`, backend will return a startup error asking to install `pg`.
- If `STORAGE_DRIVER` is omitted and `DATABASE_URL` exists, backend auto-selects driver by URL scheme (`mysql://` or `postgresql://`).
