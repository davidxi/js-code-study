/**
 * @providesModule performanceNow
 */
var performance = require('./performance');

var nowObject = performance;
if (!nowObject || !nowObject.now) {
    nowObject = Date;
}
var performanceNow = nowObject.now.bind(nowObject);

module.exports = performanceNow;