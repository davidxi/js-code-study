/**
 * @providesModule EventEmitter
 */
var EmitterSubscription = require('./EmitterSubscription');
var ErrorUtils = require('./ErrorUtils');
var EventSubscriptionVendor = require('./EventSubscriptionVendor');
var emptyFunction = require('./emptyFunction');
var invariant = require('./invariant');
var StopwatchPool = require('./StopwatchPool');
var LogBuffer = require('./LogBuffer');

function EventEmitter() {
    this._eventSubscription = new EventSubscriptionVendor();
    this._currentSubscription = null;
}
EventEmitter.prototype.addListener = function(eventType, listener, context) {
    var subscription = new EmitterSubscription(this._eventSubscription, listener, context);
    return this._eventSubscription.addSubscription(eventType, subscription);
};
EventEmitter.prototype.once = function(eventType, listener, context) {
    var emitter = this;
    return this.addListener(eventType, function() {
        emitter.removeCurrentListener();
        listener.apply(context, arguments);
    });
};
EventEmitter.prototype.removeAllListeners = function(eventType) {
    // 'eventType' can be undefined, in which case, to remove all subscrptions
    this._eventSubscription.removeAllSubscriptions(eventType);
};
EventEmitter.prototype.removeCurrentListener = function() {
    invariant(!!this._currentSubscription);
    this._eventSubscription.removeSubscription(this._currentSubscription);
};
EventEmitter.prototype.listeners = function(eventType) {
    var subscriptionsOfType = this._eventSubscription.getSubscriptionsForType(eventType);
    if (subscriptionsOfType) {
        // @todo: purpose of .filter(emptyFunction.thatReturnsTrue) ?
        return subscriptionsOfType.filter(emptyFunction.thatReturnsTrue).map(function(subscription) {
            return subscription.listener;
        });
    } else {
        return [];
    }
};
EventEmitter.prototype.emit = function(eventType) {
    var subscriptionsOfType = this._eventSubscription.getSubscriptionsForType(eventType);
    if (subscriptionsOfType) {
        var q = Object.keys(subscriptionsOfType);
        var stopWatch = StopwatchPool.acquire();
        for (var s = 0; s < q.length; s++) {
            // @todo:
            // since subscriptionsOfType is an array, what's the purpose of doing
            //   Object.keys(foo) + foo[Object.keys(foo)[i]] ?
            var t = q[s];
            var subscription = subscriptionsOfType[t];
            if (subscription) {
                this._currentSubscription = subscription;
                var listernerMeta = subscription.listener.__SMmeta || {
                    name: subscription.listener.name || '<anonymous function>'
                };
                stopWatch.reset();
                ErrorUtils.applyWithGuard(
                    subscription.listener, // fn
                    subscription.context, // context
                    Array.prototype.slice.call(arguments, 1), // fn args
                    null,
                    'EventEmitter:' + eventType // guart tag
                );
                var timeElapsed = stopWatch.read();
                LogBuffer.write('event_handler_performance', {
                    functionMeta: listernerMeta,
                    time: timeElapsed,
                    context: eventType
                });
            }
        }
        this._currentSubscription = null;
    }
};
module.exports = EventEmitter;