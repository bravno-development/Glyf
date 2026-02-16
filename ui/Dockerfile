FROM node:20-alpine AS builder

ARG VITE_API_URL
ARG VITE_POSTHOG_KEY
ARG NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY ui/package.json ui/pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

COPY ui/ .
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_POSTHOG_KEY=$VITE_POSTHOG_KEY
ENV NODE_ENV=$NODE_ENV
RUN pnpm build

FROM nginx:alpine

COPY ui/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
