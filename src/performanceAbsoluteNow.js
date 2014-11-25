/**
 * @providesModule performanceAbsoluteNow
 */
var performance = require('performance');
var performanceAbsoluteNow;

if (performance.now && performance.timing && performance.timing.navigationStart) {
    // http://www.w3.org/TR/2012/REC-navigation-timing-20121217/#sec-navigation-timing-interface
    var _time = performance.timing.navigationStart;
    performanceAbsoluteNow = function() {
        return performance.now.apply(performance, arguments) + _time;
    };
} else {
    performanceAbsoluteNow = Date.now.bind(Date);
}
module.exports = performanceAbsoluteNow;