# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Copy dependency files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (includes Prisma generate via postinstall)
RUN npm ci

# Copy source code
COPY . .

# Ensure public directory exists
RUN mkdir -p public

# Build Next.js app (output: 'standalone' creates optimized bundle)
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

# Install runtime dependencies
RUN apk add --no-cache bash curl postgresql-client

WORKDIR /app
ENV NODE_ENV=production

# Create user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Copy standalone bundle (single layer)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy public directory
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy other necessary files
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --chown=nextjs:nodejs start.sh ./

RUN chmod +x start.sh

USER nextjs
EXPOSE 3000

CMD ["bash", "start.sh"]
