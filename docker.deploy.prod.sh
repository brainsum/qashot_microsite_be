#!/usr/bin/env bash

git pull

./docker.pull-images.sh && \
    ./docker.stratup.prod.sh && \
    ./docker.database-migrations.sh

./docker.cleanup.sh
