#!/usr/bin/env bash

git pull

./docker.pull-images.sh && \
    ./docker.startup.prod.sh && \
    ./docker.database-migrations.sh

./docker.cleanup.sh
