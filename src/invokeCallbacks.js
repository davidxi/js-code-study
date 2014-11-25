/**
 * @providesModule invokeCallbacks
 */
var ErrorUtils = require('ErrorUtils');

function invokeCallbacks(callbacks, context) {
    if (callbacks) {
        for (var k = 0; k < callbacks.length; k++) {
            ErrorUtils.applyWithGuard(new Function(callbacks[k]), context);
        }
    }
}
module.exports = invokeCallbacks;