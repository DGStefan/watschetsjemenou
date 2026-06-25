# ---- Wattekenjemenou: één container die de gebouwde client + de sockets serveert ----
# Coolify: zet de Build Pack op "Dockerfile" en de poort op 3000.

FROM node:22-alpine
WORKDIR /app

# Eerst alleen de manifesten kopiëren (betere Docker layer-cache).
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/
COPY packages/client/package.json ./packages/client/

# Alle dependencies (incl. dev) — nodig om te bouwen.
RUN npm ci

# Broncode kopiëren en alles bouwen (client via Vite, server via tsup).
COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
