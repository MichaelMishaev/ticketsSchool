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

# Install bash and postgresql-client for startup script and SQL execution
RUN apk add --no-cache bash curl postgresql-client

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy standalone output (includes minimal node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy static files for Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy public files
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy Prisma schema and scripts
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Copy startup script
COPY --chown=nextjs:nodejs start.sh ./

# Set permissions for startup script
RUN chmod +x start.sh

# Regenerate Prisma client in runner stage (ensures it's fresh and accessible)
RUN npx prisma generate

USER nextjs

# Expose port
EXPOSE 3000

# Start command
CMD ["bash", "start.sh"]