'use strict';

const MessageQueue = require('../lib/message-queue');

// @todo: Add "origin" to the exchanges.
let exposedChannelConfigs = {};
exposedChannelConfigs['firefox'] = {
    'name': 'firefox',
    'queue': `backstop-firefox`,
    'exchange': 'backstop-worker',
    'routing': `firefox-results`
};

const exposedMessageQueue = new MessageQueue('ExposedMQ', process.env.RESULTS_RABBITMQ_URL, exposedChannelConfigs);

module.exports = exposedMessageQueue;
