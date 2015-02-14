/**
 * @providesModule Scrollable
 */
var Event = require('./Event');
var Parent = require('./Parent');
var UserAgent_DEPRECATED = require('UserAgent_DEPRECATED');

var respondToMouseWheelEvent = function(event) {
    var scrollableNode = Parent.byClass(event.getTarget(), 'scrollable');
    if (!scrollableNode) {
        return;
    }
    if ((typeof event.axis !== 'undefined' && event.axis === event.HORIZONTAL_AXIS) ||
        (event.wheelDeltaX && !event.wheelDeltaY) ||
        (event.deltaX && !event.deltaY)) {
        return;
    }
    var deltaUpwards = event.wheelDelta || -event.deltaY || -event.detail;
    var scrollHeight = scrollableNode.scrollHeight;
    var clientHeight = scrollableNode.clientHeight;
    if (scrollHeight > clientHeight) {
        var scrollTop = scrollableNode.scrollTop;
        if ((deltaUpwards > 0 && scrollTop === 0) || (deltaUpwards < 0 && scrollTop >= scrollHeight - clientHeight - 1)) {
            event.prevent();
        } else if (UserAgent_DEPRECATED.ie() < 9) {
            if (scrollableNode.currentStyle) {
                var fontSize = scrollableNode.currentStyle.fontSize;
                if (fontSize.indexOf('px') < 0) {
                    // convert em to px
                    var tmpNode = document.createElement('div');
                    tmpNode.style.fontSize = fontSize;
                    tmpNode.style.height = '1em';
                    fontSize = tmpNode.style.pixelHeight;
                } else {
                    fontSize = parseInt(fontSize, 10);
                }
                scrollableNode.scrollTop = scrollTop - Math.round(deltaUpwards / 120 * fontSize);
                event.prevent();
            }
        }
    }
};
var docRoot = document.documentElement;
if (UserAgent_DEPRECATED.firefox()) {
    var evtType = ('WheelEvent' in window) ? 'wheel' : 'DOMMouseScroll';
    docRoot.addEventListener(evtType, respondToMouseWheelEvent, false);
} else {
    Event.listen(docRoot, 'mousewheel', respondToMouseWheelEvent);
}