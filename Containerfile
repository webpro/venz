FROM node:24-slim

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY packages/cdn/package.json packages/cdn/

RUN corepack enable && pnpm install --frozen-lockfile --filter @venz/cdn...

COPY packages/shared/src/ packages/shared/src/
COPY packages/cdn/src/ packages/cdn/src/

ENV PORT=8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD node -e "fetch('http://localhost:8080/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

USER node

WORKDIR /app/packages/cdn
CMD ["node", "src/server.ts"]
