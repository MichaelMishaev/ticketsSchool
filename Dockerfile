FROM node:18-alpine

# Install bash for the start script
RUN apk add --no-cache bash

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Copy and make start script executable
COPY start.sh ./
RUN chmod +x start.sh

# Expose port
EXPOSE 3000

# Start command
CMD ["sh", "start.sh"]