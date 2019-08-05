#!/usr/bin/env bash

services=('web' 'queue' 'mailer')

for service in "${services[@]}"
do
  echo "NPM status for ${service}:"
  cd "${service}" && npm outdated -l
  npm audit
  cd ..
  echo ""
done
