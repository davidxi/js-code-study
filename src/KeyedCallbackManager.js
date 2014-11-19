/**
 * @providesModule KeyedCallbackManager
 */
var CallbackManagerController = require('./CallbackManagerController.js');
var Deferred = require('./Deferred.js');
var ErrorUtils = require('./ErrorUtils.js');
var copyProperties = require('./copyProperties.js');

function KeyedCallbackManager() {
    this._resources = {};
    this._controller = new CallbackManagerController(this._constructCallbackArg.bind(this));
}
copyProperties(KeyedCallbackManager.prototype, {
    executeOrEnqueue: function(requests, fn) /*callbackId(int)*/{
        if (!(requests instanceof Array)) {
            var request_ = requests;
            var fn_ = fn;
            requests = [requests];
            fn = function(resourcesNeeded) {
                fn_(resourcesNeeded[request_]);
            };
        }
        requests = requests.filter(function(request) {
            var isRequestNull = (request !== null && request !== undefined);
            if (!isRequestNull) {
                ErrorUtils.applyWithGuard(function() {
                    throw new Error('KeyedCallbackManager.executeOrEnqueue: key ' + JSON.stringify(request) + ' is invalid');
                });
            }
            return isRequestNull;
        });
        return this._controller.executeOrEnqueue(requests, fn);
    },
    deferredExecuteOrEnqueue: function(requests) {
        var deferred = new Deferred();
        this.executeOrEnqueue(requests, deferred.succeed.bind(deferred));
        return deferred;
    },
    unsubscribe: function(callbackId) {
        this._controller.unsubscribe(callbackId);
    },
    reset: function() {
        this._controller.reset();
        this._resources = {};
    },
    getUnavailableResources: function(callbackId) /*Array[request1, request2, ...]*/ {
        var callback = this._controller.getRequest(callbackId);
        var unavaiable = [];
        if (callback) {
            unavaiable = callback.request.filter(function(request) {
                return !this._resources[request];
            }.bind(this));
        }
        return unavaiable;
    },
    getUnavailableResourcesFromRequest: function(requestList) {
        var requests = Array.isArray(requestList) ? requestList : [requestList];
        return requests.filter(function(request) {
            if (request !== null && request !== undefined) {
                return !this._resources[request];
            }
        }, this);
    },
    addResourcesAndExecute: function(resources) {
        copyProperties(this._resources, resources);
        this._controller.runPossibleCallbacks();
    },
    setResource: function(request, m) {
        this._resources[request] = m;
        this._controller.runPossibleCallbacks();
    },
    getResource: function(request) {
        return this._resources[request];
    },
    getAllResources: function() {
        return this._resources;
    },
    dumpResources: function() {
        var ret = {};
        for (var m in this._resources) {
            var n = this._resources[m];
            if (typeof n === 'object') {
                // clone a new one to dump
                n = copyProperties({}, n);
            }
            ret[m] = n;
        }
        return ret;
    },
    _constructCallbackArg: function(requests) {
        var resourcesNeeded = {};
        for (var n = 0; n < requests.length; n++) {
            var request = requests[n];
            var p = this._resources[request];
            if (typeof p == 'undefined') {
                return false;
            }
            resourcesNeeded[request] = p;
        }
        return [resourcesNeeded];
    }
});
module.exports = KeyedCallbackManager;