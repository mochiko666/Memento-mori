# builder stage: install dev deps and build
FROM node:20 AS builder
WORKDIR /app
RUN git clone --depth 1 https://github.com/Mar-7th/StarRailRes.git \
 && rm -rf ./StarRailRes/.git \
 && git clone --depth 1 https://github.com/Mar-7th/StarRailScore.git \
 && rm -rf ./StarRailScore/.git
COPY package*.json ./
ARG GITHUB_TOKEN
RUN npm config set //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN} \
 && npm ci \
 && npm config delete //npm.pkg.github.com/:_authToken
COPY . .
RUN npm run build

# runtime stage: production deps + built output only
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/StarRailRes ./StarRailRes
COPY --from=builder /app/StarRailScore ./StarRailScore
EXPOSE 8000
CMD ["node", "dist/index.js"]