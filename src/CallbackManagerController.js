/**
 * @providesModule CallbackManagerController
 */
var ErrorUtils = require('./ErrorUtils.js');
var copyProperties = require('./copyProperties.js');

function CallbackManagerController(callbackArgHandler) {
    this._pendingIDs = [];
    this._allRequests = [undefined];
    // if callbackArgHandler(...) returns false,
    // callback would not be invoked.
    this._callbackArgHandler = callbackArgHandler;
}

copyProperties(CallbackManagerController.prototype, {
    executeOrEnqueue: function(requests/*Array*/, fn, opts) /*callbackId(int)*/ {
        opts = opts || {};
        if (this._attemptCallback(fn, requests, opts)) {
            // fn is already being invoked
            return 0;
        }
        this._allRequests.push({
            fn: fn,
            request: requests,
            options: opts
        });
        var callbackId = this._allRequests.length - 1;
        this._pendingIDs.push(callbackId);
        return callbackId;
    },
    unsubscribe: function(callbackId) {
        delete this._allRequests[callbackId];
    },
    reset: function() {
        this._allRequests = [];
    },
    getRequest: function(callbackId) {
        return this._allRequests[callbackId];
    },
    runPossibleCallbacks: function() {
        var pendingIds = this._pendingIDs;
        this._pendingIDs = [];
        var toInvoke = [];
        pendingIds.forEach(function(pendingId) {
            var callback = this._allRequests[pendingId];
            if (!callback) {
                // cause the following block uses 'delete', 
                // so there are holes
                return;
            }
            if (this._callbackArgHandler(callback.request, callback.options)) {
                toInvoke.push(pendingId);
            } else {
                // send back to pending state
                this._pendingIDs.push(pendingId);
            }
        }.bind(this));
        toInvoke.forEach(function(pendingId) {
            var callback = this._allRequests[pendingId];
            delete this._allRequests[pendingId];
            this._attemptCallback(callback.fn, callback.request, callback.options);
        }.bind(this));
    },
    _attemptCallback: function(fn, request, opts) {
        if (this._callbackArgHandler(request, opts)) {
            var n = {
                ids: request
            };
            ErrorUtils.applyWithGuard(fn, n, opts);
            return true;
        }
        return false;
    }
});

module.exports = CallbackManagerController;