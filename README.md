# ClearPoint — powered by MindsSparc

Diagnostic-to-action engine for enterprise AI readiness consulting. ClearPoint helps consultants run structured assessments that produce traceable diagnoses, intervention roadmaps, and business cases -- not just maturity scores.

## Quick Start

**Prerequisites:** Node.js 18+, pnpm 9+

```bash
# Install dependencies
pnpm install

# Set up the database
cp apps/api/.env.example apps/api/.env
pnpm --filter api exec npx prisma migrate dev

# Start both frontend and API
pnpm dev
```

Open `http://localhost:5173` and log in with the credentials from your `.env` file (defaults: `consultant@mindssparc.com` / `change-this`).

## Architecture

```
mindssparc-assessment/
├── apps/
│   ├── web/          React 18 + TypeScript + Vite + Tailwind
│   └── api/          Express + TypeScript + Prisma (SQLite dev / Postgres prod)
├── packages/
│   ├── shared-types/       TypeScript types shared across apps
│   ├── question-bank/      182 assessment questions as authored JSON
│   └── diagnostic-rules/   Pattern matching rules for the engine
```

### How the Engine Works

1. Consultant configures an engagement: domains in scope, intervention weights, ambition targets.
2. Client answers behavioural questions (5-point scale with anchors + confidence level).
3. Answers are scored: `rawScore * confidenceMultiplier * baseWeight * interventionWeight`.
4. Pattern matching rules fire against scored answers to identify root causes.
5. Root causes generate a sequenced 30/60/90-day roadmap with full evidence trails.
6. Claude API generates plain-language narratives (optional -- structured fallback works without it).

Every output traces back to specific client answers. No black boxes.

## Environment Setup

Copy `apps/api/.env.example` to `apps/api/.env` and configure:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | `file:./dev.db` for SQLite, Postgres connection string for prod |
| `JWT_SECRET` | Yes | Auth token signing key. Change from default in production. |
| `CONSULTANT_EMAIL` | Yes | Login email for the consultant account |
| `CONSULTANT_PASSWORD` | Yes | Login password for the consultant account |
| `ANTHROPIC_API_KEY` | No | Enables AI-generated narrative summaries. Falls back to structured output. |
| `PORT` | No | API server port (default: 3001) |
| `VITE_APP_URL` | No | Frontend URL for CORS in production |
| `NODE_ENV` | No | Set to `production` for restrictive CORS and startup checks |

## Running in Development

```bash
# Full stack (frontend + API)
pnpm dev

# API only
pnpm --filter api dev

# Frontend only
pnpm --filter web dev
```

The API runs on `http://localhost:3001` with a health check at `/api/health`.

## Integration Testing

```bash
# Run the integration test script
pnpm --filter api test:integration

# Or manually hit the health check
curl http://localhost:3001/api/health
```

The health endpoint returns database status, question bank size, and environment info.

## Question Bank

Questions live in `packages/question-bank/questions.json`. Each question requires `preAnswerContext`, `diagnosticPatterns`, `anchors`, and an `interventionSignal` -- incomplete questions break the explainability chain.

Current coverage (182 questions):

| Domain | Code | Count |
|--------|------|-------|
| Customer & Revenue | CRV | 20 |
| Marketing & Demand | MKT | 24 |
| Service & Retention | SVC | 22 |
| Operations & Fulfillment | OPS | 24 |
| People & Organisation | PPL | 22 |
| Finance & Risk | FIN | 22 |
| Technology & Data | TEC | 24 |
| Product & Innovation | PRD | 24 |

To add questions: edit `questions.json` directly, following the schema in `packages/shared-types`. Run `pnpm --filter question-bank build` to regenerate the loader.

## Building for Production

```bash
# Build all packages and apps
pnpm build

# Run API in production mode
NODE_ENV=production node apps/api/dist/index.js
```

For production deployments:
- Use PostgreSQL (update `DATABASE_URL`)
- Set a strong `JWT_SECRET`
- Set `NODE_ENV=production`
- Set `VITE_APP_URL` to your frontend domain for CORS

## License

Proprietary. All rights reserved by mindssparc.
