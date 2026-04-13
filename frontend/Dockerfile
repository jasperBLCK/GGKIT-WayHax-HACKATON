# ── Frontend Dockerfile ──
# Кроссплатформенный: Mac (ARM/x86), Ubuntu, Windows
FROM node:20-alpine

WORKDIR /app

# Кэширование зависимостей
COPY package.json package-lock.json ./
RUN npm ci

# Копирование кода приложения
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
