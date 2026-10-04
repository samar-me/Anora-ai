FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache git ca-certificates

# Copy package files from samara_bot
COPY samara_bot/package*.json ./samara_bot/

# Install dependencies inside samara_bot
WORKDIR /app/samara_bot
RUN npm install --omit=dev

# Copy all repository files (including Obsidian_Vault and data)
WORKDIR /app
COPY . .

# Change to samara_bot folder
WORKDIR /app/samara_bot
ENV NODE_ENV=production

CMD ["node", "index.js"]
