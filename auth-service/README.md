# Auth Service

A lightweight authentication microservice (Node.js + TypeScript) used for managing user signup/signin and issuing JWTs.

## 🧭 Branch Workflow

- **`dev`**: Staging branch for ongoing development and integration testing.
- **`master`**: Production branch (release-ready code).
- **`main`**: Default main branch (used for initial commits and as a base for `dev`/`master`).

> ⚠️ Note: Keep `master` stable and only merge in tested changes from `dev`.

## 📁 File Structure

```
auth-service/
  ├── docker-compose.yml         # Local docker compose configuration
  ├── Dockerfile                 # Docker image build
  ├── package.json               # NPM scripts & dependencies
  ├── tsconfig.json              # TypeScript compiler settings
  ├── prisma/                    # Prisma schema + migrations
  │   ├── schema.prisma
  │   └── migrations/
  ├── src/                       # Application source code
  │   ├── server.ts              # App entrypoint
  │   ├── common/                # Shared utilities/constants
  │   ├── config/                # Configuration loaders
  │   ├── middleware/            # Express middleware
  │   ├── modules/               # Feature modules (e.g., auth)
  │   └── utils/                 # Helper utilities (crypto/jwt)
  └── tests/                     # Unit and integration tests
      ├── unit/
      └── integration/
```

## ▶️ Quick Start (Local)

```bash
npm install
npm run dev
```

## 🧪 Testing

```bash
npm test
```

## 🔧 Notes

- Environment variables are loaded from `.env` (see `src/config/env.config.ts`).
- Prisma migrations live under `prisma/migrations/`.
