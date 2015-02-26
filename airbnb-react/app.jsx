var SearchDispatcher = require("./dispatchers/SearchDispatcher");
if (window.Airbnb.Utils.isDev()) {
    // hmm good idea to log all flux payload in debug mode ( ♥_♥ )
    SearchDispatcher.register(function(payload) {
        if ("value" in payload) {
            console.log("action ", payload.type, " with value ", JSON.stringify(payload.value, undefined, "  "), " ", payload)
        } else {
            console.log("action", payload.type, payload)
        }
    })
}

var React = require("react");
var $SearchForm = require("./views/SearchForm.jsx");
var SavedSearchAPI = require("./api/SavedSearchAPI");
var SavedSearchActions = require("./actions/SavedSearchActions");
var App = {
    stores: {
        LocationSuggestions: require("./stores/LocationSuggestionStore"),
        SavedSearches: require("./stores/SavedSearchStore"),
        SearchParams: require("./stores/SearchParamsStore"),
        AirEvents: require("./stores/AirEventStore")
    },
    actions: {
        Form: require("./actions/FormActions"),
        SavedSearch: require("./actions/SavedSearchActions"),
        LocationSuggestion: require("./actions/LocationSuggestionActions"),
    },
    constants: require("./constants/SearchConstants"),
    dispatcher: SearchDispatcher,
    init: function() {
        $(window).on("load", function() {
            Airbnb.Utils.loadGooglePlaces()
        });

        var formNode = $("#search_form").parent();
        var locationVal = formNode.find("[name=location]").val();
        var checkinVal = formNode.find("[name=checkin]").val();
        var checkoutVal = formNode.find("[name=checkout]").val();
        var guestsVal = formNode.find("[name=guests]").val();

        if (locationVals) {
            App.actions.Form.setSearchText(locationVal)
        }
        if (checkinVal) {
            App.actions.Form.setCheckIn(checkinVal)
        }
        if (checkoutVal) {
            App.actions.Form.setCheckOut(checkoutVal)
        }
        if (guestsVal && guestsVal !== "1") {
            App.actions.Form.setGuestCount(guestsVal)
        }
        React.render(React.createElement($SearchForm, {
            strings: BootstrapData.get("search_form_data")
        }), formNode.get(0))
    }
}

module.exports = App;