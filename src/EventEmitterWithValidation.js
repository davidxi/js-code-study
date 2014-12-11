/**
 * @providesModule EventEmitterWithValidation
 */
var EventEmitter = require('./EventEmitter.js');

for (var h in EventEmitter) {
    if (EventEmitter.hasOwnProperty(h)) EventEmitterWithValidation[h] = EventEmitter[h];
}

var protoEmitter = EventEmitter === null ? null : EventEmitter.prototype;
EventEmitterWithValidation.prototype = Object.create(protoEmitter);
EventEmitterWithValidation.prototype.constructor = EventEmitterWithValidation;
EventEmitterWithValidation.__superConstructor__ = EventEmitter;

function EventEmitterWithValidation(m) {
    EventEmitter.call(this);
    this._allowedEventTypes = Object.keys(m);
}
EventEmitterWithValidation.prototype.emit = function(eventType) {
    validateEventType(eventType, this._allowedEventTypes);
    return protoEmitter.emit.apply(this, arguments);
};

function validateEventType(eventType, allowedEventTypes) {
    if (allowedEventTypes.indexOf(eventType) === -1) {
        throw new TypeError(validationError(eventType, allowedEventTypes));
    }
}

function validationError(m, n) {
    var o = 'Unknown event type "' + m + '". ';
    o += 'Known event types: ' + n.join(', ') + '.';
    return o;
}
module.exports = EventEmitterWithValidation;
