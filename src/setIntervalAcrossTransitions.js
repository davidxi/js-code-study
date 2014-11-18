/**
 * @providesModule setIntervalAcrossTransitions
 */
function setIntervalAcrossTransitions(fn, ticks) {
    return global.setInterval(fn, ticks, false);
}
module.exports = setIntervalAcrossTransitions;