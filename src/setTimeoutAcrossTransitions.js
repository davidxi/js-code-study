/**
 * @providesModule setTimeoutAcrossTransitions
 */
function setTimeoutAcrossTransitions(fn, ticks) {
    return global.setTimeout(fn, ticks, false); // @todo: where is setTimeout() additional arguments support shimmed ?
}
module.exports = setTimeoutAcrossTransitions;