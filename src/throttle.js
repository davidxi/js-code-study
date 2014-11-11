/**
 * @providesModule throttle
 */
var copyProperties = require('./copyProperties.js');

function throttle(func, ticks, context) {
    return _throttle(func, ticks, context, false, false);
}
copyProperties(throttle, {
    acrossTransitions: function(func, ticks, context) {
        return _throttle(func, ticks, context, true, false);
    },
    withBlocking: function(func, ticks, context) {
        return _throttle(func, ticks, context, false, true);
    },
    acrossTransitionsWithBlocking: function(func, ticks, context) {
        return _throttle(func, ticks, context, true, true);
    }
});

function _throttle(func, ticks, context, isAcrossTransitions, isBlocking) {
    (ticks == null) && (ticks = 100);
    var funcArgs, startTime, timeout = null;
    var done = function() {
        startTime = Date.now();
        if (funcArgs) {
            func.apply(context, funcArgs);
            funcArgs = null;
            timeout = setTimeout(done, ticks, !isAcrossTransitions);
        } else {
            timeout = null;
        }
    };
    return function() {
        funcArgs = arguments;
        if (timeout === null || (Date.now() - startTime > ticks)) {
            if (isBlocking) {
                done();
            } else {
                timeout = setTimeout(done, 0, !isAcrossTransitions);
            }
        }
    };
}
module.exports = throttle;