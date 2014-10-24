/**
 * @providesModule Arbiter
 */
var copyProperties = require('./copyProperties.js');
var createArrayFrom = require('./createArrayFrom.js');
var invariant = require('./invariant.js');

var CallbackDependencyManager = require('./CallbackDependencyManager.js');
var ErrorUtils = require('./ErrorUtils.js');
var EventEmitter = require('./EventEmitter.js');
var EventHolder = require('./EventHolder.js');
var EventEmitterWithHolding = require('./EventEmitterWithHolding.js');

function Arbiter() {
    this._arbiterEventHolder = new ArbiterEventHolder();
    this._eventEmitterWithHolding = new EventEmitterWithHolding(new EventEmitter(), this._arbiterEventHolder);
    this._callbackDependencyManager = new CallbackDependencyManager();
    this._mapEventPrevented = [];
    /*
      [{ eventType: isEventPrevented}, {eventType: isEventPrevented}, ...]
      every event emit cycle has an object
    */
}

Arbiter.prototype.subscribe = function(eventTypes, listener, behavior) {
    eventTypes = createArrayFrom(eventTypes);
    eventTypes.forEach(function(x) {
        invariant(x && typeof x === 'string');
    });

    invariant(typeof listener === 'function');

    behavior = behavior || Arbiter.SUBSCRIBE_ALL;    
    invariant(behavior === Arbiter.SUBSCRIBE_NEW || behavior === Arbiter.SUBSCRIBE_ALL);

    // [EventEmitter::ListenerSubscription]
    // can use listenerSubscription.remove()
    var listenerSubscriptions = eventTypes.map(function(eventType) {
        var listenerBound = this._bindEventPrevent.bind(this, listener, eventType);
        if (behavior === Arbiter.SUBSCRIBE_NEW)
            return this._eventEmitterWithHolding.addListener(eventType, listenerBound);
        this._mapEventPrevented.push({});
        var listenerSubscription = this._eventEmitterWithHolding.addRetroactiveListener(eventType, listenerBound);
        this._mapEventPrevented.pop();
        return listenerSubscription;
         
    }, this);
    return new ArbiterToken(this, listenerSubscriptions);
};
Arbiter.prototype._bindEventPrevent = function(listener, eventType, v) {
    var currentEventEmitCycle = this._mapEventPrevented[this._mapEventPrevented.length - 1];
    if (currentEventEmitCycle[eventType] === false)
        return;
    var isEventPrevented = ErrorUtils.applyWithGuard(listener, null, [eventType, v]);
    if (isEventPrevented === false)
        this._eventEmitterWithHolding.releaseCurrentEvent();
    currentEventEmitCycle[eventType] = isEventPrevented;
};
Arbiter.prototype.unsubscribeCurrentSubscription = function() {
    this._eventEmitterWithHolding.removeCurrentListener();
};
Arbiter.prototype.releaseCurrentPersistentEvent = function() {
    this._eventEmitterWithHolding.releaseCurrentEvent();
};
Arbiter.prototype.subscribeOnce = function(eventTypes, listener, behavior) {
    var arbiterToken = this.subscribe(eventTypes, function(x, y) {
        this.unsubscribeCurrentSubscription();
        return listener(x, y);
    }.bind(this), behavior);
    return arbiterToken;
};
Arbiter.prototype.unsubscribe = function(arbiterToken) {
    invariant(arbiterToken.isForArbiterInstance(this));
    arbiterToken.unsubscribe();
};
Arbiter.prototype.inform = function(eventTypes, eventFirstArg, behavior) {
    var isSingleEvent = Array.isArray(eventTypes);
    eventTypes = createArrayFrom(eventTypes);
    behavior = behavior || Arbiter.BEHAVIOR_EVENT;
    var x = (behavior === Arbiter.BEHAVIOR_STATE) ||
    		(behavior === Arbiter.BEHAVIOR_PERSISTENT);
    this._mapEventPrevented.push({});
    for (var i = 0; i < eventTypes.length; i++) {
        var eventType = eventTypes[i];
        invariant(eventType);
        this._arbiterEventHolder.setHoldingBehavior(eventType, behavior);
        this._eventEmitterWithHolding.emitAndHold(eventType, eventFirstArg);
        this._satisfyDependency(eventType, eventFirstArg, x);
    }
    var aa = this._mapEventPrevented.pop();
    return isSingleEvent ? aa : aa[eventTypes[0]];
};
Arbiter.prototype.query = function(eventType) {
    var behavior = this._arbiterEventHolder.getHoldingBehavior(eventType);
    invariant(!behavior || behavior === Arbiter.BEHAVIOR_STATE);
    var v = null;
    this._arbiterEventHolder.emitToListener(eventType, function(heldEventFirstArg) {
        v = heldEventFirstArg;
    });
    return v;
};
Arbiter.prototype.registerCallback = function(listenerOrDependencyToken, eventTypes) {
    if (typeof listenerOrDependencyToken === 'function') {
        return this._callbackDependencyManager.registerCallback(listenerOrDependencyToken, eventTypes);
    } else
        return this._callbackDependencyManager.addDependenciesToExistingCallback(listenerOrDependencyToken, eventTypes);
};
Arbiter.prototype._satisfyDependency = function(eventType, eventFirstArg, isPersistentSatisfyDependency) {
    if (eventFirstArg === null)
        return;
    if (isPersistentSatisfyDependency) {
        this._callbackDependencyManager.satisfyPersistentDependency(eventType);
    } else
        this._callbackDependencyManager.satisfyNonPersistentDependency(eventType);
};

// ----------------------------------
//  ArbiterEventHolder
// ----------------------------------

var protoEventHolder = EventHolder === null ? null : EventHolder.prototype;

ArbiterEventHolder.prototype = Object.create(protoEventHolder);
ArbiterEventHolder.prototype.constructor = ArbiterEventHolder;
ArbiterEventHolder.__superConstructor__ = EventHolder;

for (var p in EventHolder) {
    if (EventHolder.hasOwnProperty(p))
        ArbiterEventHolder[p] = EventHolder[p];
}

function ArbiterEventHolder() {
    EventHolder.call(this);
    this._heldEvent = {};
}

ArbiterEventHolder.prototype.setHoldingBehavior = function(eventType, behavior) {
    this._heldEvent[eventType] = behavior;
};

ArbiterEventHolder.prototype.getHoldingBehavior = function(eventType) {
    return this._heldEvent[eventType];
};

/**
  * @param {...*} Arbitrary arguments to be passed to each registered listener
  */
ArbiterEventHolder.prototype.holdEvent = function(eventType, u, v, w, x) {
    var behavior = this._heldEvent[eventType];
    if (behavior !== Arbiter.BEHAVIOR_PERSISTENT)
        this._emitToListener(eventType);
    if (behavior !== Arbiter.BEHAVIOR_EVENT)
        return protoEventHolder.holdEvent.call(this, eventType, u, v, w, x);
};

ArbiterEventHolder.prototype._emitToListener = function(eventType) {
    this.emitToListener(eventType, this.releaseCurrentEvent, this);
};

ArbiterEventHolder.prototype.releaseEvent = function(eventType) {
    if (eventType) {
        protoEventHolder.releaseEvent.call(this, eventType);
    }
};

// ----------------------------------
//  ArbiterToken  
//    returned by Arbiter.prototype.subscribe()
// ----------------------------------

function ArbiterToken(arbiter, listenerSubscriptions) {
    this._arbiter = arbiter;
    this._listenerSubscriptions = listenerSubscriptions; // array
}
ArbiterToken.prototype.unsubscribe = function() {
    for (var t = 0; t < this._listenerSubscriptions.length; t++)
        this._listenerSubscriptions[t].remove();
    this._listenerSubscriptions.length = 0;
};
ArbiterToken.prototype.isForArbiterInstance = function(arbiter) {
    invariant(this._arbiter);
    return this._arbiter === arbiter;
};

// ----------------------------------
//  exports
// ----------------------------------

copyProperties(Arbiter, {
    SUBSCRIBE_NEW: 'new',
    SUBSCRIBE_ALL: 'all',
    BEHAVIOR_EVENT: 'event',
    BEHAVIOR_STATE: 'state',
    BEHAVIOR_PERSISTENT: 'persistent'
});

Object.keys(Arbiter.prototype).forEach(function(t) {
    Arbiter[t] = function() {
        var u = (this instanceof Arbiter) ? this : Arbiter;
        return Arbiter.prototype[t].apply(u, arguments);
    };
});
Arbiter.call(Arbiter);

module.exports = Arbiter;