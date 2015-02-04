/**
 * @providesModule EventSubscriptionVendor
 */
var invariant = require('./invariant');

function EventSubscriptionVendor() {
    this._subscriptionByType = {};
}
EventSubscriptionVendor.prototype.addSubscription = function(eventType, subscription) {
    // 'subscription' is an instance of EmitterSubscription {subscriber, listener, context}
    invariant(subscription.subscriber === this);
    if (!this._subscriptionByType[eventType]) {
        this._subscriptionByType[eventType] = [];
    }
    var key = this._subscriptionByType[eventType].length;
    this._subscriptionByType[eventType].push(subscription);
    subscription.eventType = eventType;
    subscription.key = key;
    return subscription;
};
EventSubscriptionVendor.prototype.removeAllSubscriptions = function(eventType) {
    if (eventType === undefined) {
        this._subscriptionByType = {};
    } else {
        delete this._subscriptionByType[eventType];
    }
};
EventSubscriptionVendor.prototype.removeSubscription = function(subscription) {
    // 'subscription' is an instance of EmitterSubscription {subscriber, listener, context}
    var eventType = subscription.evenType;
    var key = subscription.key;
    var subscriptionsOfType = this._subscriptionByType[eventType];
    if (subscriptionsOfType) {
        delete subscriptionsOfType[key];
    }
};
EventSubscriptionVendor.prototype.getSubscriptionsForType = function(eventType) {
    return this._subscriptionByType[eventType];
};

module.exports = EventSubscriptionVendor;