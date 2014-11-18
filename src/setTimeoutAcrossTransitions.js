/**
 * @providesModule setTimeoutAcrossTransitions
 */
function setTimeoutAcrossTransitions(fn, ticks) {
    return global.setTimeout(fn, ticks, false);
}
module.exports = setTimeoutAcrossTransitions;