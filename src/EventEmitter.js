/**
 * @providesModule EventEmitter
 */
var emptyFunction = require('./emptyFunction.js');
var invariant = require('./invariant.js');

function EventEmitter() {
    this._listenersByType = {};
    this._listenerContextsByType = {};
    this._currentSubscription = {};
}

EventEmitter.prototype.addListener = function(eventType, listener, context) {
    if (!this._listenersByType[eventType]) {
        this._listenersByType[eventType] = [];
    }
    var key = this._listenersByType[eventType].length;
    this._listenersByType[eventType].push(listener);

    if (context !== undefined) {
        if (!this._listenerContextsByType[eventType]) {
            this._listenerContextsByType[eventType] = [];
        }
        this._listenerContextsByType[eventType][key] = context;
    }

    return new ListenerSubscription(this, eventType, key);
};

EventEmitter.prototype.once = function(eventType, listener, context) {
    var emitter = this;
    return this.addListener(eventType, function() {
        emitter.removeCurrentListener();
        listener.apply(context, arguments);
    });
};

EventEmitter.prototype.removeAllListeners = function(eventType) {
    if (eventType === undefined) {
        this._listenersByType = {};
        this._listenerContextsByType = {};
    } else {
        delete this._listenersByType[eventType];
        delete this._listenerContextsByType[eventType];
    }
};

EventEmitter.prototype.removeCurrentListener = function() {
    invariant(
        this._currentSubscription.key !== undefined,
        'Not in an emitting cycle; there is no current listener'
    );
    this.removeSubscription(this._currentSubscription);
};

EventEmitter.prototype.removeSubscription = function(subscription) {
    var eventType = subscription.eventType;
    var key = subscription.key;

    var listenersOfType = this._listenersByType[eventType];
    if (listenersOfType) {
        delete listenersOfType[key];
    }

    var listenerContextsOfType = this._listenerContextsByType[eventType];
    if (listenerContextsOfType) {
        delete listenerContextsOfType[key];
    }
};

EventEmitter.prototype.listeners = function(eventType) {
    var listenersOfType = this._listenersByType[eventType];
    return listenersOfType ? listenersOfType.filter(emptyFunction.thatReturnsTrue) : [];
};

EventEmitter.prototype.emit = function(eventType, a, b, c, d, e, _) {
    invariant(
        _ === undefined,
        'EventEmitter.emit currently accepts only up ' +
          'to five listener arguments.'
    );

    var listeners = this._listenersByType[eventType];
    if (listeners) {
        var contexts = this._listenerContextsByType[eventType];
        this._currentSubscription.eventType = eventType;

        var keys = Object.keys(listeners);
        for (var ii = 0; ii < keys.length; ii++) {
            var key = keys[ii];
            var listener = listeners[key];

            // The listener may have been removed during this event loop.
            if (listener) {
                var context = contexts ? contexts[key] : undefined;
                this._currentSubscription.key = key;
                if (context === undefined) {
                    listener(a, b, c, d, e);
                } else {
                    listener.call(context, a, b, c, d, e);
                }
            }
        }

        this._currentSubscription.eventType = undefined;
        this._currentSubscription.key = undefined;
    }
};

// ----------------------------------
//  ListenerSubscription
// ----------------------------------

function ListenerSubscription(emitter, eventType, key) {
    this._emitter = emitter;
    this.eventType = eventType;
    this.key = key;
}

ListenerSubscription.prototype.remove = function() {
    this._emitter.removeSubscription(this);
};

module.exports = EventEmitter;