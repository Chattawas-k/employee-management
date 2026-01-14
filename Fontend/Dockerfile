# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app

COPY Fontend/package.json Fontend/package-lock.json ./
RUN npm ci

COPY Fontend/ ./
RUN npm run build

FROM nginx:1.25-alpine AS runtime

COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/employee-queue-angular/browser /usr/share/nginx/html

EXPOSE 8080

