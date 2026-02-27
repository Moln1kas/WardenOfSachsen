FROM oven/bun:alpine

RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY package.json ./

RUN bun install --frozen-lockfile

COPY . .

RUN mkdir -p /app/data

CMD ["bun", "run", "src/index.ts"]