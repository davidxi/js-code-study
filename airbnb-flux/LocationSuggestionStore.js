var makeStore = require("./makeStore");
var Dispatcher = require("../dispatchers/SearchDispatcher");
var Constants = require("../constants/SearchConstants.js");

var cahcedLocations = [];

var Store = makeStore({
    get: function() {
        if (!cahcedLocations) {
            return []
        }
        return cahcedLocations.slice(0, 5) // show top 5
    },
    getAll: function() {
        return this.get()
    },
});
Store.dispatchToken = Dispatcher.register(function(payload) {
    switch (payload.type) {
        case Constants.RECEIVE_LOCATION_SUGGESTIONS:
            cahcedLocations = payload.locations;
            this.emitChange();
            break;
        default:
    }
}.bind(Store));
c.exports = Store