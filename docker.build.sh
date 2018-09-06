#!/usr/bin/env bash

COMPOSE_FILES="-f docker-compose.yml -f docker-compose.dev.yml"
COMPOSE_MISC_OPTIONS="--force-rm" #--no-cache

docker-compose ${COMPOSE_FILES} build ${COMPOSE_MISC_OPTIONS}
