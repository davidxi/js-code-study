/**
 * @providesModule EmitterSubscription
 */
var EventSubscription = require('./EventSubscription');

for (var h in EventSubscription) {
    if (EventSubscription.hasOwnProperty(h)) {
        EmitterSubscription[h] = EventSubscription[h];
    }
}
var protoEventSubscription = EventSubscription === null ? null : EventSubscription.prototype;
EmitterSubscription.prototype = Object.create(protoEventSubscription);
EmitterSubscription.prototype.constructor = EmitterSubscription;
EmitterSubscription.__superConstructor__ = EventSubscription;

function EmitterSubscription(subscriber, listener, context) {
    EventSubscription.call(this, subscriber);
    this.listener = listener;
    this.context = context;
}
module.exports = EmitterSubscription;