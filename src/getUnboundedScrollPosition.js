/**
 * @providesModule getUnboundedScrollPosition
 */
function getUnboundedScrollPosition(h) {
    if (h === window) {
        return {
            x: window.pageXOffset || document.documentElement.scrollLeft,
            y: window.pageYOffset || document.documentElement.scrollTop
        };
    }
    return {
        x: h.scrollLeft,
        y: h.scrollTop
    };
}
module.exports = getUnboundedScrollPosition;