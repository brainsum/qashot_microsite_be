#!/usr/bin/env bash

COMPOSE_FILES="-f docker-compose.yml"

docker-compose ${COMPOSE_FILES} exec web sh -c "sequelize db:migrate"
# @todo: Refactor these for migrations as well.
#docker-compose ${COMPOSE_FILES} exec queue sh -c "sequelize db:migrate"
#docker-compose ${COMPOSE_FILES} exec mailer sh -c "sequelize db:migrate"
