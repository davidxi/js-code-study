/**
 * @providesModule ServerTime
 */
var InitialServerTime = require('./InitialServerTime');

update(InitialServerTime.serverTime);

var elapsed;

function getMillis() {
    return Date.now() - elapsed;
}

function getOffsetMillis() {
    return elapsed;
}

function update(time) {
    elapsed = Date.now() - time;
}
module.exports = {
    getMillis: getMillis,
    getOffsetMillis: getOffsetMillis,
    update: update,
    get: getMillis,
    getSkew: getOffsetMillis
};