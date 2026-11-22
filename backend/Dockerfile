FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY scripts ./scripts
COPY demo-games ./demo-games
COPY assets ./assets

ENV NODE_ENV=development
EXPOSE 3000

CMD ["node", "src/server.js"]
