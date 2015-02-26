var Dispatcher = require("../dispatchers/SearchDispatcher");
var Constants = require("../constants/SearchConstants");

module.exports = {
    setSearchText: function(searchText) {
        Dispatcher.dispatch({
            type: Constants.SET_SEARCH_TEXT,
            value: searchText
        })
    },
    setCheckIn: function(checkIn) {
        Dispatcher.dispatch({
            type: Constants.SET_CHECK_IN,
            value: checkIn
        })
    },
    setCheckOut: function(checkOut) {
        Dispatcher.dispatch({
            type: Constants.SET_CHECK_OUT,
            value: checkOut
        })
    },
    setGuestCount: function(guestCount) {
        Dispatcher.dispatch({
            type: Constants.SET_GUEST_COUNT,
            value: guestCount
        })
    },
    submitForm: function() {
        Dispatcher.dispatch({
            type: Constants.SUBMIT_FORM
        })
    }
}