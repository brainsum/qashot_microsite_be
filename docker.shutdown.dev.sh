#!/usr/bin/env bash

COMPOSE_FILES="-f docker-compose.yml -f docker-compose.dev.yml"

docker-compose ${COMPOSE_FILES} stop
