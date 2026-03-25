#!/bin/sh
echo "=== ClearPoint API Starting ==="
echo "DATABASE_URL set: $([ -n "$DATABASE_URL" ] && echo 'yes' || echo 'NO')"
echo "DIRECT_URL set: $([ -n "$DIRECT_URL" ] && echo 'yes' || echo 'NO')"
echo "JWT_SECRET set: $([ -n "$JWT_SECRET" ] && echo 'yes' || echo 'NO')"
echo "PORT: ${PORT:-3001}"

echo "Running Prisma migrations..."
npx prisma migrate deploy 2>&1 || echo "WARNING: Migration failed — tables may need manual setup via prisma db push"

echo "Trying prisma db push as fallback..."
npx prisma db push --accept-data-loss 2>&1 || echo "WARNING: db push also failed"

echo "Starting server..."
exec node dist/index.js
