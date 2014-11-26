/**
 * @providesModule DOMEventListener
 */
var wrapFunction = require('wrapFunction');

var add_, remove_;

if (window.addEventListener) {
    add_ = function(elem, eventType, handler) {
        handler.wrapper = wrapFunction(handler, 'entry', 'DOMEventListener.add ' + eventType);
        elem.addEventListener(eventType, handler.wrapper, false);
    };
    remove_ = function(elem, eventType, handler) {
        elem.removeEventListener(eventType, handler.wrapper, false);
    };
} else if (window.attachEvent) {
    add_ = function(elem, eventType, handler) {
        handler.wrapper = wrapFunction(handler, 'entry', 'DOMEventListener.add ' + eventType);
        elem.attachEvent('on' + eventType, handler.wrapper);
    };
    remove_ = function(elem, eventType, handler) {
        elem.detachEvent('on' + eventType, handler.wrapper);
    };
} else {
    remove_ = add_ = function() {/* no-op */};
}

var DOMEventListener = {
    add: function(elem, eventType, handler) {
        add_(elem, eventType, handler);
        return {
            remove: function() {
                remove_(elem, eventType, handler);
                // erase DOM reference in closure
                elem = null;
            }
        };
    },
    remove: remove_
};
module.exports = DOMEventListener;