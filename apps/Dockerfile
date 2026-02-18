# --- Build Stage ---
FROM node:24.13-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Production Stage ---
FROM node:24.13-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
# あとで対応
# COPY --from=builder /app/next.config.js ./

EXPOSE 3000
CMD ["npm", "start"]
