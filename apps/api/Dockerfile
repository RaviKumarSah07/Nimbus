# syntax=docker/dockerfile:1

# ---------- deps: install the full workspace dependency tree ----------
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci

# ---------- build: generate the Prisma client for THIS platform, compile everything ----------
FROM deps AS build
# Without this, Prisma can't detect libssl and silently guesses a version -
# it happened to guess right in testing, but that's not something to rely on.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY packages/shared packages/shared
COPY packages/db packages/db
COPY apps/api apps/api
RUN npm run build --workspace=packages/shared
# Prisma's query engine binary is platform-specific - this must run inside
# the Linux build stage, not reuse whatever a developer generated locally.
RUN npx prisma generate --schema=packages/db/prisma/schema.prisma
RUN npm run build --workspace=packages/db
RUN npm run build --workspace=apps/api

# ---------- runtime: only what's needed to run the compiled server ----------
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
# The query engine binary dynamically links against libssl at runtime, not
# just at `prisma generate` time - needed here too, not only in the build stage.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# A leaner image would prune devDependencies out of node_modules here;
# kept as a single full copy for simplicity in a portfolio-scale deploy.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json

COPY --from=build /app/packages/db/dist ./packages/db/dist
COPY --from=build /app/packages/db/generated ./packages/db/generated
COPY --from=build /app/packages/db/package.json ./packages/db/package.json
COPY --from=build /app/packages/db/prisma ./packages/db/prisma

COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json

EXPOSE 4000
CMD ["node", "apps/api/dist/server.js"]
