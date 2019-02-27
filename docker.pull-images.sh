#!/usr/bin/env bash

DOCKER_FILES="-f docker-compose.yml"
DOCKER_PULL_SERVICES="web mailer queue"
docker-compose ${DOCKER_FILES} pull ${DOCKER_PULL_SERVICES}
