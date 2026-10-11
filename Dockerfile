FROM node:24-bookworm-slim AS base
WORKDIR /app
# Build tools are only a fallback for better-sqlite3 when no prebuilt binary matches.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

FROM base AS build
ENV DATABASE_URL="file:./data/cipher-lab.db" \
    NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    DATABASE_URL="file:./data/cipher-lab.db" \
    PORT=3000
COPY --from=build /app /app
RUN mkdir -p /app/data && chown -R node:node /app/data /app/.next
USER node
EXPOSE 3000
VOLUME ["/app/data"]
CMD ["sh", "docker-entrypoint.sh"]
