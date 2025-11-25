# builder stage: install dev deps and build
FROM node:22 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# runtime stage: production deps + built output only
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
EXPOSE 8000
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/index.js"]