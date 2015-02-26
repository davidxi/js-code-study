var makeStore = require("./makeStore");
var Dispatcher = require("../dispatchers/SearchDispatcher");
var Constants = require("../constants/SearchConstants.js");
var SavedSearchAPI = require("../api/SavedSearchAPI");

var savedSearches = SavedSearchAPI.getLatest(30).filter(filterSearchWithLocation);

var searchText = "";

var Store = makeStore({
    _searchesForQuery: function(searchText) {
        if (!searchText) {
            return getOneTimeSearch(savedSearches)
        }
        var _searchText = normalizeString(searchText);
        var eligibleSearches = savedSearches.filter(function(search) {
            var w = normalizeString(search.search_params.location);
            return w.indexOf(_searchText) === 0
        });
        return getOneTimeSearch(eligibleSearches)
    },
    get: function() {
        return this._searchesForQuery(searchText)
    },
    getAll: function() {
        return savedSearches.slice()
    },
    _onAPIChange: function(searches) {
        savedSearches = searches.filter(filterSearchWithLocation);
        this.emitChange()
    }
});
Store.dispatchToken = Dispatcher.register(function(payload) {
    switch (payload.type) {
        case Constants.RECEIVE_SAVED_SEARCHES:
            savedSearches = payload.searches.filter(filterSearchWithLocation);
            this.emitChange();
            break;
        case Constants.SET_SEARCH_TEXT:
            searchText = payload.value;
            this.emitChange();
            break;
        default:
    }
}.bind(Store));

SavedSearchAPI.on("change", Store._onAPIChange);

module.exports = Store;

function normalizeString(s) {
    return s.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`'"~()]/g, "").
            replace(/\s+/g, " ").
            toLowerCase()
}

function filterSearchesByFrequency(searches, hashFn, threshold) {
    var countMap = {};
    var results = [];
    searches.forEach(function(search) {
        var hash = hashFn(search);
        var frequency = 1 + (countMap[hash] || 0);
        countMap[hash] = frequency;
        if (frequency <= threshold) {
            results.push(search)
        }
    });
    return results
}

function serializeParams(search) {
    var params = search.search_params;
    return [
        normalizeString(params.location),
        params.checkin || "",
        params.checkout || "",
        params.guests || 1
    ].join("|")
}

function getOneTimeSearch(searches) {
    return filterSearchesByFrequency(searches, serializeParams, 1)
}

function filterSearchWithLocation(search) {
    return "location" in search.search_params
}