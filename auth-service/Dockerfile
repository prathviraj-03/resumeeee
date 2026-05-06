FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
# Install dependencies (including devDependencies for build tooling).
RUN npm install
COPY . .
# Generate Prisma client for the target platform.
RUN npx prisma generate
# Compile TypeScript sources.
RUN npm run build
# Remove build dependencies to keep the final image lean.
RUN npm prune --production
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
