# Resume Forge Profile Service

A production-grade microservice for managing user profiles and resume uploads.

## Tech stack
- Node.js 20
- TypeScript (strict)
- Express.js
- Prisma (PostgreSQL)
- AWS S3 (uploads + pre-signed URLs)
- Bull (Redis) for event publishing
- Jest + Supertest for testing

## Environment Variables
See `.env.example` for required variables.

## Running Locally
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
npm start
```
