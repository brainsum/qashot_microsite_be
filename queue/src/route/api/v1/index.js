'use strict';

const express = require('express');
const router = express.Router();

router.use('/queue', require('./queue'));

module.exports = router;
