# Build
FROM node:10.9.0-alpine

ARG EXPOSED_PORT

LABEL maintainer="mhavelant"

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["npm", "start"]

EXPOSE $EXPOSED_PORT

WORKDIR /home/node/app

HEALTHCHECK --interval=20s --timeout=3s --retries=3 \
    CMD node healthcheck.js

ENV PATH="/home/node/app/node_modules/.bin:$PATH" \
    NODE_ENV=production \
    EXPOSED_PORT=$EXPOSED_PORT

RUN apk add --no-cache tini

COPY package*.json ./

RUN npm install --only=production && \
    npm cache -g clean --force && \
    mkdir -p /home/node/app/runtime && \
    chown -R node:node /home/node

COPY . .

USER node