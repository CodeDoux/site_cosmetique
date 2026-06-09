# Étape 1 : build Angular
FROM node:20 as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Étape 2 : serveur nginx
FROM nginx:alpine

# copier le build Angular (IMPORTANT: wildcard pour éviter erreur de dist)
COPY --from=build /app/dist/site_cosmetique/browser/ /usr/share/nginx/html/

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80