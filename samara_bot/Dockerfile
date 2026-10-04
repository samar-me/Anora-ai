FROM node:20-alpine

WORKDIR /app

# Install git and required dependencies
RUN apk add --no-cache git ca-certificates

# Copy dependency manifests
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy project code
COPY . .

# Set production environment
ENV NODE_ENV=production

# Run bot
CMD ["npm", "start"]
