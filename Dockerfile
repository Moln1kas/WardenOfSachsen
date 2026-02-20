FROM oven/bun:latest

WORKDIR /app

COPY package.json ./

RUN bun install --frozen-lockfile

COPY . .

RUN mkdir -p /app/data

CMD ["bun", "run", "src/index.ts"]