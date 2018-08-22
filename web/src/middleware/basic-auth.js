'use strict';

const auth = require('basic-auth');
const compare = require('tsscmp');


const adminName = process.env.ADMIN_USER;
const adminPass =  process.env.ADMIN_PASS;

function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.send(401);
}

// Basic function to validate credentials for example
function check (name, pass) {
    let valid = true;

    // Simple method to prevent short-circut and use timing-safe compare
    valid = compare(name, adminName) && valid;
    valid = compare(pass, adminPass) && valid;

    return valid
}

/**
 *
 * @param {Request} req
 * @param {Response} res
 * @param next
 * @return {*}
 */
module.exports = function (req, res, next) {
    const credentials = auth(req);

    if (!credentials || !check(credentials.name, credentials.pass)) {
        return unauthorized(res);
    }

    return next();
};
