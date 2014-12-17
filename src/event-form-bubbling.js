/**
 * @providesModule event-form-bubbling
 */
global.Event = global.Event || function() {};

// Event.__getHandler() and Event.__fire() are defined in 'Event' module

global.Event.__inlineSubmit = function(elem, event) {
    var handler = (global.Event.__getHandler && global.Event.__getHandler(elem, 'submit'));
    return handler ? null : global.Event.__bubbleSubmit(elem, event);
};
global.Event.__bubbleSubmit = function(elem, event) {
    if (document.documentElement.attachEvent) {
        var handlerReturned;
        while (handlerReturned !== false && (elem = elem.parentNode)) {
            handlerReturned = elem.onsubmit ?
                              elem.onsubmit(event) :
                              global.Event.__fire && global.Event.__fire(elem, 'submit', event);
        }
        return handlerReturned;
    }
};