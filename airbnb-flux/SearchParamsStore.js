var makeStore = require("./makeStore");
var Dispatcher = require("../dispatchers/SearchDispatcher");
var Constants = require("../constants/SearchConstants.js");
var FormActions = require("../actions/FormActions");
var SavedSearchAPI = require("../api/SavedSearchAPI");
var AirEventStore = require("./AirEventStore");

function getInitialParams() {
    return {
        location: ""
    }
}
var params = getInitialParams();
var location = false;
var inSubmit = false;

var Store = makeStore({
    validate: function(s) {
        if (s || error) {
            error = !params.location
        }
    },
    getParams: function() {
        return params
    },
    getError: function() {
        return error
    },
    isSubmitting: function() {
        return inSubmit
    },
    performSearch: function() {
        if (!params.ss_id) {
            var s = SavedSearchAPI.getOrCreate(params);
            params.ss_id = s.saved_search_id
        }
        params.source = "bb";
        var queryString = "/s" + "?" + jQuery.param(params);
        if (Airbnb.Utils.isDev()) {
            console.log("constructed search uri", queryString, "from", _.clone(params))
        }
        window.location.assign(queryString);
        inSubmit = true
    }
});

Store.dispatchToken = Dispatcher.register(function(payload) {
    switch (payload.type) {
        case Constants.SET_SEARCH_TEXT:
            params.location = payload.value;
            this.validate();
            this.emitChange();
            break;
        case Constants.SET_CHECK_IN:
            params.checkin = payload.value;
            this.validate();
            this.emitChange();
            break;
        case Constants.SET_CHECK_OUT:
            params.checkout = payload.value;
            this.validate();
            this.emitChange();
            break;
        case Constants.SET_GUEST_COUNT:
            params.guests = payload.value;
            this.validate();
            this.emitChange();
            break;
        case Constants.SELECT_LOCATION_SUGGESTION:
            params.location = payload.location.description;
            this.validate();
            this.emitChange();
            break;
        case Constants.SELECT_SAVED_SEARCH:
            Dispatcher.waitFor([AirEventStore.dispatchToken]);
            params = payload.search.search_params;
            params.ss_id = payload.search.saved_search_id;
        case Constants.SUBMIT_FORM:
            this.validate(true);
            if (!error) {
                this.performSearch()
            }
            this.emitChange();
            break;
        default:
    }
}.bind(Store));

module.exports = Store