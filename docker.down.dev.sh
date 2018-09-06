#!/usr/bin/env bash

COMPOSE_FILES="-f docker-compose.yml -f docker-compose.dev.yml"
COMPOSE_MISC_OPTIONS="-v --remove-orphans"

docker-compose ${COMPOSE_FILES} down ${COMPOSE_MISC_OPTIONS}
