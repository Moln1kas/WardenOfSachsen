FROM oven/bun:latest

WORKDIR /app

COPY package.json ./

RUN bun install --frozen-lockfile

COPY . .

RUN mkdir -p /app/data && chown -R bun:bun /app/data

USER bun

CMD ["sh", "-c", "bunx drizzle-kit migrate && bun run src/index.ts"]