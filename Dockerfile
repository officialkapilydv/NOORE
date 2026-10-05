# syntax=docker/dockerfile:1.7
# ─────────────────────────────────────────────────────────────────────────────
# NOORÉ — storefront + admin + API in one image.
#   stage "deps"    installs every workspace dependency once
#   stage "build"   compiles the Vite/React storefront (client/dist)
#   stage "runtime" production-only server deps + built client, served by Express
# ─────────────────────────────────────────────────────────────────────────────

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
RUN npm ci --no-audit --no-fund

FROM deps AS build
COPY client ./client
COPY shared ./shared
RUN npm run build --workspace client

FROM node:22-alpine AS runtime
ENV NODE_ENV=production \
    PORT=4000
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
RUN npm ci --omit=dev --workspace server --no-audit --no-fund && npm cache clean --force
COPY server ./server
COPY shared ./shared
COPY --from=build /app/client/dist ./client/dist
# writable locations (mounted as named volumes by docker-compose)
RUN mkdir -p server/data server/public/images/uploads && chown -R node:node /app
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server/src/index.js"]
