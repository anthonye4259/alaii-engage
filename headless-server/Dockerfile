# ---- Build stage ----
FROM node:20-slim AS builder

WORKDIR /app

# Copy all source files
COPY package.json tsconfig.json server.ts ./
COPY headless/ ./headless/

# Install deps
RUN npm install

# ---- Runtime stage ----
FROM node:20-slim

# Install Chromium + dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV NODE_ENV=production

WORKDIR /app

# Copy everything from builder (TypeScript runs via tsx at runtime)
COPY --from=builder /app ./

EXPOSE 3099

# Run directly with tsx (no build step needed)
CMD ["npx", "tsx", "server.ts"]
