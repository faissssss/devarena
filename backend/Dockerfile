FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json

RUN npm ci --workspace=backend --include-workspace-root=false

COPY backend ./backend
COPY .env.production.example ./.env.production.example

WORKDIR /app/backend

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
