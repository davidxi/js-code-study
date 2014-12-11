/**
 *  @providesModule Focus
 */
var CSS = require('CSS');
var DOM = require('DOM');
var Event = require('Event');
var Run = require('Run');
var ge = require('ge');

var eventHandlers = {},
    hasSetFocusEventRootListen;
var Focus = {
    set: function(inputElem) {
        try {
            inputElem.tabIndex = inputElem.tabIndex; // @todo why ?
            inputElem.focus();
        } catch (t) {}
    },
    setWithoutOutline: function(inputElem) {
        // ._5f0v {
        //   outline: none
        // }
        CSS.addClass(inputElem, "_5f0v");
        var handlerSubscription = Event.listen(inputElem, 'blur', function() {
            CSS.removeClass(inputElem, "_5f0v");
            handlerSubscription.remove(); // once
        });
        Focus.set(inputElem);
    },
    relocate: function(inputElem, relocateElem) {
        // ._3oxt {
        //   outline: 1px dotted #3b5998;
        //   outline-color: invert
        // }
        Focus.listen(inputElem, function(isFocusInEvent) {
            CSS.conditionClass(relocateElem, "_3oxt", isFocusInEvent);
        });
        CSS.addClass(inputElem, "_5f0v");
    },
    listen: function(elem, listener) {
        setFocusEventRootListener();
        var elemId = DOM.getID(elem);
        eventHandlers[elemId] = listener;
        Run.onLeave(removeEmptyElementHandler.bind(null, elemId));
    }
};

function setFocusEventRootListener() {
    if (hasSetFocusEventRootListen) {
        return;
    }
    Event.listen(document.documentElement, 'focusout', dispatchFocusEvent);
    Event.listen(document.documentElement, 'focusin', dispatchFocusEvent);
    hasSetFocusEventRootListen = true;
}

function dispatchFocusEvent(event) {
    var targetElem = event.getTarget();
    if (typeof eventHandlers[targetElem.id] === 'function') {
        var isFocusInEvent = event.type === 'focusin' || // not supported in FireFox
            event.type === 'focus'; // 'focus' event can not bubble
        eventHandlers[targetElem.id](isFocusInEvent);
    }
}

function removeEmptyElementHandler(handlerBoundElementId) {
    if (eventHandlers[handlerBoundElementId] && !ge(handlerBoundElementId)) {
        delete eventHandlers[handlerBoundElementId];
    }
}
module.exports = Focus;