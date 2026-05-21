# Etapa 1: build 
FROM node:20-slim AS builder 
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
FROM node:20-slim 
WORKDIR /app 
COPY --from=builder /app ./ 
EXPOSE 4321 
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4321"]