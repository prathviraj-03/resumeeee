# Auth Service

A dedicated authentication microservice built with **Node.js**, **TypeScript**, **Express**, and **Prisma**. This service manages user registration, login, JWT issuance, refresh tokens, password reset, and protected user profile access.

---

## Overview

The auth service is responsible for:

- User registration and credential storage
- Password hashing and secure login
- JWT access token generation
- Refresh token management
- Password reset token generation
- Protected `/api/auth/me` profile route
- Rate limiting for login and password reset endpoints
- Health checks and middleware security

It is primarily designed to operate as a standalone microservice and can be run locally or in Docker.

---

## Architecture

- `src/server.ts` — Express app setup and route mounting
- `src/config/env.config.ts` — environment validation using Joi
- `src/config/database.config.ts` — Prisma database client singleton
- `src/config/redis.config.ts` — Redis client initialization
- `src/modules/auth/` — auth feature module
  - `auth.routes.ts` — route definitions
  - `auth.controller.ts` — request handlers
  - `auth.service.ts` — auth business logic
  - `auth.repository.ts` — Prisma database access layer
  - `auth.validator.ts` — request validation schemas
- `src/middleware/` — authentication, rate limiting, and error handling
- `src/utils/` — JWT, bcrypt, and secure token utilities
- `prisma/schema.prisma` — database model definitions

---

## Key Technologies

- Node.js 20
- TypeScript 5
- Express 5
- Prisma 6 + PostgreSQL
- Redis 5
- JWT authentication with `jsonwebtoken`
- Password hashing with `bcrypt`
- Request validation with `Joi`
- Secure HTTP headers with `helmet`
- CORS support via `cors`
- Request compression via `compression`
- Logging readiness via `pino`
- Rate limiting via `express-rate-limit`

---

## Environment Variables

Copy `.env.example` to `.env` and update the values.

Required values:

- `PORT` — server port (default `3000`)
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `JWT_SECRET` — JWT signing secret
- `JWT_EXPIRES_IN` — access token life (default `1h`)
- `JWT_REFRESH_SECRET` — refresh token signing secret
- `JWT_REFRESH_EXPIRES_IN` — refresh token life (default `7d`)

Example `.env`:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your_jwt_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d
```

---

## Database Schema

The service uses Prisma with PostgreSQL. The current schema includes:

- `User` — stored user record with email, hashed password, role, and timestamps
- `RefreshToken` — refresh token records with expiry and user relation
- `PasswordResetToken` — password reset token records with expiry and user relation

Models are defined in `prisma/schema.prisma`.

---

## API Endpoints

### Health
- `GET /health`
  - Returns service health status

### Auth routes (`/api/auth`)
- `POST /api/auth/register`
  - Create a new user account
  - Request body: `{ email, password }`
- `POST /api/auth/login`
  - Authenticate a user and issue access + refresh tokens
  - Request body: `{ email, password }`
- `POST /api/auth/refresh`
  - Exchange a refresh token for a new access token
  - Request body: `{ refreshToken }`
- `POST /api/auth/logout`
  - Invalidate a refresh token (logout behavior placeholder)
- `GET /api/auth/me`
  - Protected route returning authenticated user details
  - Requires `Authorization: Bearer <token>` header
- `POST /api/auth/forgot-password`
  - Generate a password reset token for the given email
  - Request body: `{ email }`
- `POST /api/auth/reset-password`
  - Reset a user's password using a valid reset token
  - Request body: `{ token, password }`

---

## Authentication Flow

- Users register with email and password
- Passwords are hashed using `bcrypt`
- On login, the service validates credentials and returns:
  - `accessToken` — JWT used for protected requests
  - `refreshToken` — long-lived refresh token stored in the database
- Refresh tokens are stored in the `RefreshToken` table
- Password reset tokens are stored in the `PasswordResetToken` table
- Auth middleware verifies JWTs for protected endpoints

---

## Middleware and Security

- `helmet()` adds secure HTTP headers
- `cors()` enables cross-origin requests
- `compression()` compresses responses
- `express.json()` parses JSON request bodies
- `express-rate-limit` throttles login and password reset endpoints
- Custom error middleware handles Joi validation, service errors, and Prisma failures

---

## Local Development

Install dependencies and start in development mode:

```bash
cd auth-service
npm install
npm run dev
```

The server will start on the port defined by `PORT` (default `3000`).

---

## Docker

Build and run with Docker:

```bash
docker compose up --build -d
```

The compose stack includes:

- `auth` — auth service container
- `postgres` — PostgreSQL database
- `redis` — Redis cache

Stop the stack with:

```bash
docker compose down
```

---

## Build and Production

Build the TypeScript project:

```bash
npm run build
```

Start the compiled server:

```bash
npm start
```

The Dockerfile also runs `npx prisma migrate deploy` before launching the final app.

---

## Tests

A `tests/` folder exists for unit and integration tests, but the current `npm test` script is a placeholder.

If you add a test framework, run:

```bash
npm test
```

---

## Notes

- `src/config/database.config.ts` uses a Prisma singleton to avoid duplicate client instances during development.
- `src/config/redis.config.ts` connects to Redis and logs errors.
- `src/utils/jwt.util.ts` signs and verifies JWT tokens.
- `src/utils/crypto.util.ts` generates secure random token strings.
- Rate limits are configured in `src/common/constants.ts`.

---

## Useful Commands

```bash
npm install
npm run dev
npm run build
npm start
docker compose up --build -d
docker compose down
```
