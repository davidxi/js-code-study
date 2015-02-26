var Dispatcher = require("../dispatchers/SearchDispatcher");
var Constants = require("../constants/SearchConstants");
var Cancelable = require("../util/Cancelable");

var requestCallbacks = [];
var googMaps = null;

Airbnb.Utils.withGooglePlaces(function() {
    googMaps = new google.maps.places.AutocompleteService()
});

var Actions = {
    receive: function(locations) {
        Dispatcher.dispatch({
            type: Constants.RECEIVE_LOCATION_SUGGESTIONS,
            locations: locations
        })
    },
    select: function(location) {
        Dispatcher.dispatch({
            type: Constants.SELECT_LOCATION_SUGGESTION,
            location: location
        })
    },
    requestForSearchText: function(searchText) {
        requestCallbacks.forEach(function(requestCallback) {
            requestCallback.cancel()
        });
        requestCallbacks = [];

        if (searchText === "" || googMaps === null) {
            Actions.receive([]);
            return
        }

        var requestCallback = Cancelable(function (locations, status) {
            var n = google.maps.places.PlacesServiceStatus;
            if (!(status == n.OK || status == n.ZERO_RESULTS)) {
                throw Error("Bad places response: " + status)
            }
            Actions.receive(locations)
        });
        requestCallbacks.push(requestCallback);

        // getPlacePredictions(
        //    request:AutocompletionRequest,
        //    callback:function(Array<AutocompletePrediction>, PlacesServiceStatus)
        // )
        googMaps.getPlacePredictions({
            input: searchText,
            types: ["geocode"],
        }, requestCallback.action)
    }
}

module.exports = Actions;