/**
 * @providesModule memoize
 */
var invariant = require('./invariant.js');

function memoize(fn) {
    var result;
    return function() {
        for (var args = [], l = 0, m = arguments.length; l < m; l++) {
            args.push(arguments[l]);
        }
        invariant(!args.length);
        if (memoize) {
            result = fn(); // why not pass args when call fn() ??
            fn = null;
        }
        return result;
    };
}
module.exports = memoize;