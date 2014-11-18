/**
 * @providesModule debounceAcrossTransitionsg
 */
var debounce = require('./debounce.js');

function debounceAcrossTransitions(i, j, k) {
    return debounce(i, j, k, true);
}
module.exports = debounceAcrossTransitions;