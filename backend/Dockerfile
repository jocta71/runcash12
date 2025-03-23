FROM node:18-slim

WORKDIR /app

COPY api/package*.json ./

RUN npm install --omit=dev

COPY api/ ./

ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "index.js"] 