# Etapa 1: build 
FROM node:20-alpine AS builder 
WORKDIR /app 

# Copiar archivos de dependencia
COPY package*.json ./ 

# Configurar reintentos de npm para redes inestables e instalar dependencias
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install

# Copiar el resto del código y compilar
COPY . . 
RUN npm run build 

# Etapa 2: producción 
FROM node:20-alpine 
WORKDIR /app 
COPY --from=builder /app ./ 

# Crear el directorio de uploads para imágenes subidas por usuarios.
# IMPORTANTE: monta este directorio como volumen para persistencia entre deploys:
#   docker run -v uploads_data:/app/uploads ...
#   o en docker-compose:
#     volumes:
#       - uploads_data:/app/uploads
RUN mkdir -p /app/uploads/logos /app/uploads/avatars

EXPOSE 4321 
CMD ["node", "./dist/server/entry.mjs"]