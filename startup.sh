#!/bin/sh
npx prisma migrate deploy
node ./scripts/run.js &
npm start
