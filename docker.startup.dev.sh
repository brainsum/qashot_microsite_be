#!/usr/bin/env bash

COMPOSE_FILES="-f docker-compose.yml -f docker-compose.dev.yml"
COMPOSE_MISC_OPTIONS="-d --remove-orphans"

docker-compose ${COMPOSE_FILES} up ${COMPOSE_MISC_OPTIONS}

echo "Waiting a bit for services to start up.."
sleep 10
docker-compose ${COMPOSE_FILES} ps

#docker-compose logs -f
