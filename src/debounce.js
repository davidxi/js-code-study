/**
 * @providesModule debounce
 */
var debounceCore = require('./debounceCore.js');

function debounce(fn, ticks, context, isAcrossTransitions) {
    if (ticks == null) {
        ticks = 100;
    }
    var setTimeout = function(fn, ticks, isAcrossTransitions) {
        return global.setTimeout(fn, ticks, isAcrossTransitions, !isAcrossTransitions);
    };
    return debounceCore(fn, ticks, context, setTimeout);
}
module.exports = debounce;