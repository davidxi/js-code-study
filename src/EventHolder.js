/**
 * @providesModule EventHolder
 */
var invariant = require('./invariant.js');

function EventHolder() {
    this._eventsByType = {};
    this._currentEventTokens = [];
}

EventHolder.prototype.holdEvent = function(eventType, a, b, c, d, e, _) {
    this._eventsByType[eventType] = this._eventsByType[eventType] || [];
    var eventsOfType = this._eventsByType[eventType];
    var token = {
        eventType: eventType,
        index: eventsOfType.length
    };
    eventsOfType.push([a, b, c, d, e, _]);
    return token;
};

EventHolder.prototype.emitToListener = function(eventType, listener, context) {
    var eventsOfType = this._eventsByType[eventType];
    if (!eventsOfType) return;

    eventsOfType.forEach(function(eventObj, _) {
        if (!eventObj) return;
        this._currentEventTokens.push({
            eventType: eventType,
            index: _
        });
        // eventObj = [a, b, c, d, e, _]
        listener.apply(context, eventObj);
        this._currentEventTokens.pop();
    }.bind(this));
};

EventHolder.prototype.releaseCurrentEvent = function() {
    invariant(this._currentEventTokens.length);
    this.releaseEvent(this._currentEventTokens[this._currentEventTokens.length - 1]);
};

EventHolder.prototype.releaseEvent = function(token) {
    // @todo: add validation in case undefiend null reference ?
    delete this._eventsByType[token.eventType][token.index];
};

EventHolder.prototype.releaseEventType = function(eventType) {
    this._eventsByType[eventType] = [];
};

module.exports = EventHolder;