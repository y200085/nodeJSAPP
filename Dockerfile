# Stage 1: Build base image
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
COPY package.json package-lock.json* ./
#RUN npm ci --omit=dev
RUN npm install --omit=dev

# Stage 2: Production image
FROM base AS runner
ENV NODE_ENV=production

# Create a non-privileged user for security best practices
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Change ownership of app files to non-root user
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000
CMD ["node", "server.js"]