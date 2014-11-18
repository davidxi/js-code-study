/**
 * @providesModule debounceCore
 */
function debounceCore(fn, ticks, context, setTimeout, clearTimeout) {
    setTimeout = setTimeout || global.setTimeout;
    clearTimeout = clearTimeout || global.clearTimeout;
    var _debouncedTimer;

    function debounced() {
        for (var args = [], p = 0, q = arguments.length; p < q; p++) {
            args.push(arguments[p]);
        }
        debounced.reset();
        _debouncedTimer = setTimeout(function() {
            fn.apply(context, args);
        }, ticks);
    }
    debounced.reset = function() {
        clearTimeout(_debouncedTimer);
    };
    return debounced;
}
module.exports = debounceCore;