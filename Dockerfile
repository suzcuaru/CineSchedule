# Многоэтапная сборка для оптимизации размера образа

# Этап 1: Сборка приложения
FROM node:22-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем остальные файлы проекта
COPY . .

# Собираем приложение
RUN npm run build

# Этап 2: Production образ с nginx
FROM nginx:alpine

# Копируем собранные файлы в nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем конфигурацию nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт 8085
EXPOSE 8085

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"]
