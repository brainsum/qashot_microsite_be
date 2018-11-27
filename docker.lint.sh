#!/usr/bin/env bash

if [ ! -f ./vendor/hadolint ]; then
    echo "Hadolint not found, get the latest version here: https://github.com/hadolint/hadolint/releases"
    exit 1
fi

echo "Linting files with $(./vendor/hadolint --version)"

./vendor/hadolint ./web/Dockerfile
echo ""

./vendor/hadolint ./queue/Dockerfile
echo ""

./vendor/hadolint ./mailer/Dockerfile
echo ""
