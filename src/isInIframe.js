/**
 * @providesModule isInIframe
 */
var isInIframe_ = window != window.top;

function isInIframe() {
    return isInIframe_;
}
module.exports = isInIframe;