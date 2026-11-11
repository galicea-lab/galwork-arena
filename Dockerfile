# syntax=docker/dockerfile:1
# Produkcyjny obraz galwork-arena: statyczny eksport Next.js (output:
# 'export') serwowany przez nginx, który też proxuje /v1/ do galwork-hub.
#
# Zależności @galicea-lab/* pochodzą z publicznego rejestru Forgejo
# (mapowanie scope'a w galwork-arena/.npmrc). Kontekst builda to
# katalog nadrzędny (/projekty/galwork), zgodnie z docker-compose.yml.
#
# JW 2-11-2026
# Edytory BPMN/formularzy (server/bpmn-files.mjs, Node) NIE są częścią
# tego obrazu - brak w nim autoryzacji i zapisuje bezpośrednio na dysk.
# Dlatego działa jako osobny serwis bpmn-files (docker-compose.yml)
# za nginx hosta z hasłem; NEXT_PUBLIC_BPMN_FILES_URL=/bpmn-files musi być
# podane przy buildzie (puste = wywołania na /api/... areny i 404).
# TODO: zastąpienie serwra wymianą przez API z galwork-hub

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
ARG NEXT_PUBLIC_BPMN_FILES_URL=""
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_KEYCLOAK_URL=${NEXT_PUBLIC_KEYCLOAK_URL} \
    NEXT_PUBLIC_KEYCLOAK_CLIENT=${NEXT_PUBLIC_KEYCLOAK_CLIENT} \
    NEXT_PUBLIC_BPMN_FILES_URL=${NEXT_PUBLIC_BPMN_FILES_URL}

RUN npm run build


FROM nginx:1.27-alpine AS runtime

COPY galwork-arena/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /build/galwork-arena/out /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/ > /dev/null || exit 1
