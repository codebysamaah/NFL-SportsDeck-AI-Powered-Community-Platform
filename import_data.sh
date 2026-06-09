#!/bin/sh
# docker compose run --rm import

npx prisma migrate deploy
node ./scripts/import_data.js 
