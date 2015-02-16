/**
 * @providesModule shield
 */
function shield(fn, context) {
    if (typeof fn != 'function') {
        throw new TypeError();
    }
    var args = Array.prototype.slice.call(arguments, 2);
    return function() {
        return fn.apply(context, args);
    };
}
module.exports = shield;