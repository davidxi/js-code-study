/**
 * @providesModule setImmediatePolyfill
 */
var invariant = require('invariant');
require('ImmediateImplementation');

/**
 * Window.setImmediate(func, [param1, param2, ...])
 *
 * This method is used to break up long running operations and run a
 * callback function immediately after the browser has completed other
 * operations such as events and display updates.
 */
var setImmediate = global.setImmediate;

function setImmediatePolyfill() {
    var args = [];
    for (var l = 0, m = arguments.length; l < m; l++) {
        args.push(arguments[l]);
    }
    // @todo: purpose of not using array.slice() ?
    invariant(typeof args[0] === 'function');
    return setImmediate.apply(null, args);
}
module.exports = setImmediatePolyfill;