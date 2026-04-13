# ── Backend Dockerfile ──
# Кроссплатформенный: Mac (ARM/x86), Ubuntu, Windows
FROM python:3.11-slim

# Системные зависимости для psycopg2-binary
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Кэширование зависимостей
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копирование кода приложения
COPY . .

# Создание директорий для uploads
RUN mkdir -p app/static/uploads/avatars \
             app/static/uploads/contests/files \
             app/static/uploads/certificates

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
