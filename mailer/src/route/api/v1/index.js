'use strict';

const express = require('express');
const router = express.Router();

router.use('/result', require('./result'));
router.use('/notification', require('./notification'));

module.exports = router;
