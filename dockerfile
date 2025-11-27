# Etapa 1: Build - Para compilar el código TypeScript/JavaScript
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Copiar archivos de dependencia
COPY package*.json ./
# Usamos 'npm ci' si existe package-lock.json para asegurar versiones exactas
# Instalamos todas las dependencias (incluidas las de desarrollo para la compilación)
RUN npm install

# 2. Copiar código fuente y compilar
COPY . .
# Asumimos que 'npm run build' compila el código a la carpeta 'dist/'
RUN npm run build


# Etapa 2: Runtime - Imagen ligera para ejecutar la aplicación
# Utilizamos la misma base ligera (Alpine)
FROM node:20-alpine AS runtime

WORKDIR /app

# 1. Instalar SOLO dependencias de producción en la imagen final
COPY package.json ./
COPY package-lock.json ./
# Instala solo las dependencias necesarias para la ejecución (mucho más rápido y pequeño)
RUN npm ci --production

# 2. Copiar el código compilado (solo la carpeta dist)
COPY --from=builder /app/dist ./dist

# Variables de entorno
ENV RMQ_URL=amqp://guest:guest@rabbitmq:5672
# Puerto por defecto de Node.js
EXPOSE 3000 

# Ejecutar el consumer compilado
# Asegúrate de que este script ejecuta el código compilado dentro de ./dist
CMD ["npm", "run", "start:consumer:prod"]
