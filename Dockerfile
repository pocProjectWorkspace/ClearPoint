FROM node:20-slim AS builder

RUN npm install -g pnpm@9

WORKDIR /app

# Copy workspace config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./

# Copy package.json files for all packages
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/question-bank/package.json packages/question-bank/
COPY packages/diagnostic-rules/package.json packages/diagnostic-rules/
COPY apps/api/package.json apps/api/

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy source
COPY packages/ packages/
COPY apps/api/ apps/api/

# Generate Prisma client
RUN cd apps/api && npx prisma generate

# Build packages in order
RUN pnpm --filter @mindssparc/shared-types build
RUN pnpm --filter @mindssparc/question-bank build
RUN pnpm --filter @mindssparc/diagnostic-rules build
RUN pnpm --filter @mindssparc/api build

# --- Production image ---
FROM node:20-slim

RUN npm install -g pnpm@9

WORKDIR /app

COPY --from=builder /app .

EXPOSE 3001

CMD ["sh", "-c", "cd apps/api && npx prisma migrate deploy && node dist/index.js"]
