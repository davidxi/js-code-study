/**
 * @providesModule DOMEvent
 */
var invariant = require('invariant');

function DOMEvent(event) {
    this.event = event || window.event;
    invariant(typeof(this.event.srcElement) != 'unknown');
    this.target = this.event.target || this.event.srcElement;
}
DOMEvent.prototype.preventDefault = function() {
    var event = this.event;
    if (event.preventDefault) {
        event.preventDefault();
        if (!('defaultPrevented' in event)) {
            event.defaultPrevented = true;
        }
    } else {
        event.returnValue = false;
    }
    return this;
};
DOMEvent.prototype.isDefaultPrevented = function() {
    var event = this.event;
    return ('defaultPrevented' in event) ?
        event.defaultPrevented :
        event.returnValue === false;
};
DOMEvent.prototype.stopPropagation = function() {
    var event = this.event;
    event.stopPropagation ?
        event.stopPropagation() :
        event.cancelBubble = true;
    return this;
};
DOMEvent.prototype.kill = function() {
    this.stopPropagation().preventDefault();
    return this;
};
DOMEvent.killThenCall = function(fn) {
    return function(event) {
        new DOMEvent(event).kill();
        return fn();
    };
};
module.exports = DOMEvent;