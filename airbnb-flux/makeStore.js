var EventEmitter = require("events").EventEmitter;
var extend = require("underscore").extend;

var CHANGE_EVENT = "change";

function makeStore(props) {
    var Klass = extend({}, EventEmitter.prototype, props, {
        emitChange: function() {
            this.emit(CHANGE_EVENT)
        },
        addChangeListener: function(listener) {
            this.on(CHANGE_EVENT, listener)
        },
        removeChangeListener: function(listener) {
            this.removeListener(CHANGE_EVENT, listener)
        }
    });
    Object.keys(Klass).forEach(function(k) {
        var prop = Klass[k];
        if (typeof prop === "function") {
            Klass[k] = prop.bind(Klass)
        }
    });
    return Klass
}

module.exports = makeStore;