# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy Prisma schema FIRST (before package.json to break cache)
COPY prisma ./prisma/

# Copy package files
COPY package*.json ./

# Install dependencies with postinstall disabled (we'll run prisma generate manually)
RUN npm ci --ignore-scripts

# Generate Prisma client manually
RUN npx prisma generate

# Copy source code (includes public directory)
COPY . .

# Ensure public directory exists
RUN mkdir -p public

# Build application
RUN npm run build

# Prune dev dependencies after build
RUN npm prune --production

# Production stage
FROM node:18-alpine AS runner

# Install bash for startup script
RUN apk add --no-cache bash curl

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy only necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts

# Copy startup script
COPY start.sh ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set permissions before switching user
RUN chmod +x start.sh && \
    chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 3000

# Start command
CMD ["bash", "start.sh"]