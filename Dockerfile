FROM node:20-slim AS builder

RUN npm install -g pnpm@9

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/question-bank/package.json packages/question-bank/
COPY packages/diagnostic-rules/package.json packages/diagnostic-rules/
COPY apps/api/package.json apps/api/

RUN pnpm install --no-frozen-lockfile

COPY packages/ packages/
COPY apps/api/ apps/api/

RUN cd apps/api && npx prisma generate
RUN pnpm --filter @mindssparc/shared-types build
RUN pnpm --filter @mindssparc/question-bank build
RUN pnpm --filter @mindssparc/diagnostic-rules build
RUN pnpm --filter @mindssparc/api build

FROM node:20-slim

RUN npm install -g pnpm@9

WORKDIR /app/apps/api

COPY --from=builder /app /app

RUN chmod +x start.sh

EXPOSE 3001

ENTRYPOINT ["/bin/sh", "start.sh"]
