FROM node:24-slim
RUN apt-get update && apt-get install -y fonts-dejavu-core && rm -rf /var/lib/apt/lists/*
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY packages/cdn/package.json packages/cdn/

RUN pnpm install --prod --frozen-lockfile

COPY packages/shared/src/ packages/shared/src/
COPY packages/cdn/src/ packages/cdn/src/

WORKDIR /app/packages/cdn

EXPOSE 8080
ENV PORT=8080

CMD ["node", "src/server.ts"]
