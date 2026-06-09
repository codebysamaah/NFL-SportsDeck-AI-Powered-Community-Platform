#----Build----
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl openssl-dev

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

#----Production-----
FROM node:20-alpine AS runner

WORKDIR /app
RUN apk add --no-cache openssl openssl-dev

ENV NODE_ENV=production

COPY --from=builder /app ./

EXPOSE 3000

CMD ["sh", "./startup.sh"]