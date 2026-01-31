# ========================================
# Multi-stage Dockerfile for Next.js 16
# ========================================

# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app

# Copy package files and Prisma schema (needed for postinstall)
COPY package.json package-lock.json* ./
COPY prisma ./prisma

# Install ALL dependencies (including Prisma for migrations)
RUN npm install && npm cache clean --force

# Stage 2: Builder
FROM node:22-alpine AS builder
WORKDIR /app


# Copy all dependencies from deps stage (including Prisma)
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Copy package files
COPY package.json package-lock.json* ./

# Generate Prisma Client (Prisma is already installed)
RUN npx prisma generate

# Build Next.js application
# This will create an optimized production build
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 4: Runner
FROM node:22-alpine AS runner
WORKDIR /app

# Install PostgreSQL client tools for backup/restore and su-exec for user switching
RUN apk add --no-cache postgresql16-client su-exec

# Set to production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy entrypoint script (as root before switching users)
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Copy necessary files from builder
# Copy standalone build first
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy package.json and full node_modules to ensure Prisma CLI and other scripts work
# We overwrite standalone's minimal node_modules with the full set from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy Prisma schema and migrations
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Create directories for logs and backups
RUN mkdir -p /app/logs /app/backups/database /app/public/uploads && \
    chown -R nextjs:nodejs /app/logs /app/backups /app/public/uploads

# Expose port
EXPOSE 3005

# Set hostname
ENV HOSTNAME="0.0.0.0"
# Also set HOST for some environments/frameworks that prefer it
ENV HOST="0.0.0.0" 
ENV PORT=3005

# Health check - reduced stricter dependency, just TCP check if possible or simple fetch
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:3005/api/auth/session', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Set entrypoint and default command
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
