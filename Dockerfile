FROM oven/bun:latest

WORKDIR /app

COPY package.json ./

RUN bun install --frozen-lockfile

COPY . .

RUN mkdir -p /app/data

RUN echo '#!/bin/sh\n\
bunx drizzle-kit migrate\n\
exec bun run src/index.ts' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]