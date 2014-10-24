/**
 * @providesModule EventHolder
 */
var invariant = require('./invariant.js');

function EventHolder() {
    this._heldEvents = [];
    this._eventsToRemove = [];
    this._currentEventKey = null;
}

/**
  * @param {string} eventType - Name of the event to hold and later emit
  * @param {...*} Arbitrary arguments to be passed to each registered listener
  * @return {*} Token that can be used to release the held event
  */
EventHolder.prototype.holdEvent = function(eventType, a, b, c, d, e, _) {
    var key = this._heldEvents.length;
    var event = [eventType, a, b, c, d, e, _];
    this._heldEvents.push(event);
    return key;
};

/*
 * @param {?string} eventType - Optional name of the events to replay
 * @param {function} listener - The listener to which to dispatch the event
 * @param {?object} context - Optional context object to use when invoking
 */
EventHolder.prototype.emitToListener = function(eventType, listener, context) {
    this.forEachHeldEvent(function(type, a, b, c, d, e, _) {
        if (type === eventType) {
            listener.call(context, a, b, c, d, e, _);
        }
    });
};

EventHolder.prototype.forEachHeldEvent = function(callback, context) {
    this._heldEvents.forEach(function(event, key) {
        this._currentEventKey = key;
        callback.apply(context, event);
    }, this);
    this._currentEventKey = null;
};

EventHolder.prototype.releaseCurrentEvent = function() {
    invariant(
        this._currentEventKey !== null,
        'Not in an emitting cycle; there is no current event'
    );
    delete this._heldEvents[this._currentEventKey];
};

EventHolder.prototype.releaseEvent = function(token) {
    delete this._heldEvents[token];
};

module.exports = EventHolder;