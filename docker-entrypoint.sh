#!/bin/sh
set -e

npx prisma migrate deploy

if [ "$SEED_SAMPLE_PUZZLES" = "true" ]; then
  npm run db:seed
fi

exec npm start
