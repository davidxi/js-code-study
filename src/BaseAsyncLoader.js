/**
 * @providesModule BaseAsyncLoader
 */
var KeyedCallbackManager = require('KeyedCallbackManager');
var copyProperties = require('copyProperties');

var cache = {};

// @param(sendFn) is mixed-in from another module AjaxRequest
function getLoader(endpoint, type, sendFn) {
    var callbackController = new KeyedCallbackManager();
    var hasUnavaiable = false;
    var unavaiableCallback = []; // due to unavaiable resources
    function nextCycle() {
        if (!unavaiableCallback.length || hasUnavaiable) {
            return;
        }
        hasUnavaiable = true;
        setTimeout(send, 0);
    }

    function complete(callbackIds) {
        hasUnavaiable = false;
        callbackIds.forEach(callbackController.unsubscribe.bind(callbackController));
        nextCycle();
    }

    function send() {
        var w = {};
        var callbackIdsHasUnavaiable = [];

        unavaiableCallback = unavaiableCallback.filter(function(callbackId) {
            var unavaiable = callbackController.getUnavailableResources(callbackId);
            // unavaiable -> Array[request1, request2, ...]
            if (unavaiable.length) {
                unavaiable.forEach(function(request) {
                    w[request] = true;
                });
                callbackIdsHasUnavaiable.push(callbackId);
                return true;
            }
            return false;
        });
        var unavaiableResources = Object.keys(w);
        if (unavaiableResources.length) {
            sendFn(
                endpoint,
                unavaiableResources,
                callbackIdsHasUnavaiable,
                done.bind(null, callbackIdsHasUnavaiable),
                fail.bind(null, callbackIdsHasUnavaiable)
            );
        } else {
            hasUnavaiable = false;
        }
    }

    function done(callbackIds, x) {
        var resources = x.payload[type] || x.payload;
        callbackController.addResourcesAndExecute(resources);
        complete(callbackIds);
    }

    function fail(callbackIds) { // not sure of this function purpose
        complete(callbackIds);
    }
    return {
        get: function(requests, fn) {
            var callbackId = callbackController.executeOrEnqueue(requests, fn);
            var unavaiable = callbackController.getUnavailableResources(callbackId);
            if (unavaiable.length) {
                unavaiableCallback.push(callbackId);
                nextCycle();
            }
        },
        getCachedKeys: function() {
            return Object.keys(callbackController.getAllResources());
        },
        getNow: function(request /*string*/ ) {
            return callbackController.getResource(request) || null;
        },
        set: function(resources /*object*/ ) {
            callbackController.addResourcesAndExecute(resources);
        }
    };
}

function BaseAsyncLoader(l, m) {
    throw ('BaseAsyncLoader can\'t be instantiated');
}
copyProperties(BaseAsyncLoader.prototype, {
    _getLoader: function() {
        cache[this._endpoint] || (cache[this._endpoint] = getLoader(this._endpoint, this._type, this.send));
        return cache[this._endpoint];
    },
    get: function(requests, fn) {
        return this._getLoader().get(requests, fn);
    },
    getCachedKeys: function() {
        return this._getLoader().getCachedKeys();
    },
    getNow: function(request /*string*/ ) {
        return this._getLoader().getNow(request);
    },
    reset: function() {
        cache[this._endpoint] = null;
    },
    set: function(resources /*object*/ ) {
        this._getLoader().set(resources);
    }
});
module.exports = BaseAsyncLoader;