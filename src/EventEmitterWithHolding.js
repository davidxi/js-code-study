/**
 * @providesModule EventEmitterWithHolding
 */
function EventEmitterWithHolding(emitter, holder) {
    this._emitter = emitter;
    this._eventHolder = holder;
    this._currentEventToken = null;
    this._emittingHeldEvents = false;
}

EventEmitterWithHolding.prototype.addListener = function(eventType, listener, context) {
    return this._emitter.addListener(eventType, listener, context);
};

EventEmitterWithHolding.prototype.once = function(eventType, listener, context) {
    return this._emitter.once(eventType, listener, context);
};

EventEmitterWithHolding.prototype.addRetroactiveListener = function(eventType, listener, context) {
    var subscription = this._emitter.addListener(eventType, listener, context);

    this._emittingHeldEvents = true;
    this._eventHolder.emitToListener(eventType, listener, context);
    this._emittingHeldEvents = false;

    return subscription;
};

EventEmitterWithHolding.prototype.removeAllListeners = function(eventType) {
    this._emitter.removeAllListeners(eventType);
};

EventEmitterWithHolding.prototype.removeCurrentListener = function() {
    this._emitter.removeCurrentListener();
};

EventEmitterWithHolding.prototype.removeSubscription = function(subscription) {
    this._emitter.removeSubscription(subscription);
};

EventEmitterWithHolding.prototype.listeners = function(eventType) {
    return this._emitter.listeners(eventType);
};

EventEmitterWithHolding.prototype.emit = function(eventType, a, b, c, d, e, _) {
    this._emitter.emit(eventType, a, b, c, d, e, _);
};

EventEmitterWithHolding.prototype.emitAndHold = function(eventType, a, b, c, d, e, _) {
    this._currentEventToken = this._eventHolder.holdEvent(
        eventType,
        a, b, c, d, e, _
    );
    this._emitter.emit(eventType, a, b, c, d, e, _);
    this._currentEventToken = null;
};

EventEmitterWithHolding.prototype.releaseCurrentEvent = function() {
    if (this._currentEventToken !== null) {
        this._eventHolder.releaseEvent(this._currentEventToken);
    } else if (this._emittingHeldEvents) {
        this._eventHolder.releaseCurrentEvent();
    }
};

module.exports = EventEmitterWithHolding;