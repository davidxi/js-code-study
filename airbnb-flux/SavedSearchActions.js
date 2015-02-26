var Dispatcher = require("../dispatchers/SearchDispatcher");
var Constants = require("../constants/SearchConstants");

module.exports = {
    receive: function(searches) {
        Dispatcher.dispatch({
            type: Constants.RECEIVE_SAVED_SEARCHES,
            searches: searches
        })
    },
    select: function(search) {
        Dispatcher.dispatch({
            type: Constants.SELECT_SAVED_SEARCH,
            search: search
        })
    }
}