FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY ui/package.json ui/pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

COPY ui/ .
RUN pnpm build

FROM nginx:alpine

COPY ui/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
