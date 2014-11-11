/**
 * @providesModule getViewportDimensions
 */
function docWidth() {
    return (document.documentElement && document.documentElement.clientWidth) || (document.body && document.body.clientWidth) || 0;
}

function docHeight() {
    return (document.documentElement && document.documentElement.clientHeight) || (document.body && document.body.clientHeight) || 0;
}

function getViewportDimensions() {
    return {
        width: window.innerWidth || docWidth(),
        height: window.innerHeight || docHeight()
    };
}
getViewportDimensions.withoutScrollbars = function() {
    return {
        width: docWidth(),
        height: docHeight()
    };
};

module.exports = getViewportDimensions;