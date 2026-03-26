# --- Base ---
FROM node:20-alpine AS base
# Fix: Force npm to use a writable cache directory
ENV npm_config_cache=/tmp/npm-cache
ENV NEXT_TELEMETRY_DISABLED 1

# --- Dependences ---
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Set a writable npm cache directory
ENV npm_config_cache=/tmp/.npm

COPY package.json bun.lock* package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; \
    elif [ -f bun.lock ]; then npm install; \
    else npm install; fi

# --- Rebuilder ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Add environment variables here if needed at build time, 
# although Next.js usually picks them up at runtime.
# ENV NEXT_TELEMETRY_DISABLED 1 (Moved to base)
RUN npm run build

# --- Runner ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
# ENV NEXT_TELEMETRY_DISABLED 1 (Moved to base)

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output: "standalone" from next.config.ts
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
