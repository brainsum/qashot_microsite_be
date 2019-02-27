#!/usr/bin/env bash

COMPOSE_FILES="-f docker-compose.yml -f docker-compose.dev.yml"
CUSTOM_SERVICES="web queue mailer"

docker login \
    && docker-compose ${COMPOSE_FILES} push ${CUSTOM_SERVICES}
