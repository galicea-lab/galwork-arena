# syntax=docker/dockerfile:1
# Produkcyjny obraz galwork-arena: statyczny eksport Next.js (output:
# 'export') serwowany przez nginx, który też proxuje /v1/ do galwork-hub.
#
# Zależności @galicea-lab/* pochodzą z publicznego rejestru Forgejo
# (mapowanie scope'a w galwork-arena/.npmrc). Kontekst builda to
# katalog nadrzędny (/projekty/galwork), zgodnie z docker-compose.yml.
#
# 2026-11-15: edytory BPMN/formularzy czytają i zapisują pliki obiegów
# przez API huba (/v1/wf/process-files) - osobny serwer plików nie jest
# już potrzebny.

FROM node:20-alpine AS build
WORKDIR /build

WORKDIR /build/galwork-arena
COPY galwork-arena/package.json galwork-arena/package-lock.json* galwork-arena/yarn.lock* ./
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc,required=false \
    --mount=type=secret,id=npm_token,env=NPM_TOKEN,required=false \
    corepack enable && corepack prepare yarn@1.22.22 --activate \
    && yarn install --frozen-lockfile --non-interactive

COPY galwork-arena/ ./

ARG NEXT_PUBLIC_API_URL=""
ARG NEXT_PUBLIC_KEYCLOAK_URL
ARG NEXT_PUBLIC_KEYCLOAK_CLIENT
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_KEYCLOAK_URL=${NEXT_PUBLIC_KEYCLOAK_URL} \
    NEXT_PUBLIC_KEYCLOAK_CLIENT=${NEXT_PUBLIC_KEYCLOAK_CLIENT}

RUN npm run build


FROM nginx:1.27-alpine AS runtime

COPY galwork-arena/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /build/galwork-arena/out /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/ > /dev/null || exit 1
