#!/bin/sh
echo "Running Prisma migrations..."
npx prisma migrate deploy || echo "Migration warning (may be first run)"
echo "Starting ClearPoint API..."
node dist/index.js
