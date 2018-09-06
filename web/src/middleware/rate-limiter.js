'use strict';

const RateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

const limiter = new RateLimit({
    store: new RedisStore({
        expiry: 60,
        resetExpiryOnChange: false,
        prefix: 'rate-limiter:qashot-microsite:web:',
        client: new Redis({
            port: 6379,
            host: 'redis_rate_limiter',
            family: 4,
            db: 0,
            password: process.env.RATE_LIMITER_PASSWORD
        })
        // see Configuration
    }),
    max: 100, // limit each IP to 100 requests per windowMs
    delayMs: 0 // disable delaying - full speed until the max limit is reached
});

module.exports = limiter;
