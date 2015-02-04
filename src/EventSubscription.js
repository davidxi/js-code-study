/**
 * @providesModule EventSubscription
 */

function EventSubscription(subscriber) {
    this.subscriber = subscriber;
}
EventSubscription.prototype.remove = function() {
    this.subscriber.removeSubscription(this);
};

module.exports = EventSubscription;