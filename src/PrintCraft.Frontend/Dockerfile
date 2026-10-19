FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_CURRENCY_CODE=EUR
ENV VITE_CURRENCY_CODE=${VITE_CURRENCY_CODE}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime
WORKDIR /usr/share/nginx/html

COPY --from=build /app/dist .
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
