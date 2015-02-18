/**
 * @providesModule NotificationStore
 */
var KeyedCallbackManager = require('./KeyedCallbackManager');
var NotificationConstants = require('./NotificationConstants');
var NotificationUpdates = require('./NotificationUpdates');
var RangedCallbackManager = require('./RangedCallbackManager');
var MercuryServerDispatcher = require('./MercuryServerDispatcher');

var keyedCallbacks = new KeyedCallbackManager();
var rangedCallbacks = new RangedCallbackManager(
    function(alertId) {
        var node = keyedCallbacks.getResource(alertId);
        return node.creation_time;
    },
    function(creation_time_1, creation_time_2) {
        return creation_time_1 - creation_time_2;
    }
);

var pageInfo = {};
var businessID = null;

NotificationUpdates.subscribe('update-notifications', function(arbiterEvt, memo) {
    if (memo.page_info) {
        pageInfo = memo.page_info;
    }
    if (memo.nodes === undefined) {
        return;
    }
    var alertId;
    var alertIds = [];
    var pendingNodes = {};
    var nodes = memo.nodes || [];
    var cached;
    nodes.forEach(function(node) {
        alertId = node.alert_id;
        cached = keyedCallbacks.getResource(alertId);
        if (!cached || cached.creation_time < node.creation_time) {
            alertIds.push(alertId);
            pendingNodes[alertId] = node;
        }
    });
    keyedCallbacks.addResourcesAndExecute(pendingNodes);
    rangedCallbacks.addResources(alertIds);
    NotificationUpdates.didUpdateNotifications(alertIds);
});

MercuryServerDispatcher.registerEndpoints({
    '/ajax/notifications/client/get.php': {
        mode: MercuryServerDispatcher.IMMEDIATE,
        handler: function(respJSON) {
            NotificationUpdates.handleUpdate(NotificationConstants.PayloadSourceType.ENDPOINT, respJSON);
        }
    }
});

var NotificationStore = {
    getNotifications: function(range, resolver) {
        var rangedToken = rangedCallbacks.executeOrEnqueue(0, range, function(alertIds) {
            keyedCallbacks.executeOrEnqueue(alertIds, resolver);
        });
        var unavailable = rangedCallbacks.getUnavailableResources(rangedToken);
        if (unavailable.length) {
            rangedCallbacks.unsubscribe(rangedToken);

            if (!NotificationStore.canFetchMore()) {
                keyedCallbacks.executeOrEnqueue(
                    rangedCallbacks.getAllResources(),
                    resolver
                );
                return;
            }

            var _pageInfo = pageInfo;
            var _endCursor = (_pageInfo && _pageInfo.end_cursor) || null;
            var numToFetch;
            if (_endCursor) {
                var x = Math.max.apply(null, unavailable);
                var y = rangedCallbacks.getCurrentArraySize();
                numToFetch = x - y + 1;
            } else {
                numToFetch = range;
            }
            MercuryServerDispatcher.trySend('/ajax/notifications/client/get.php', {
                businessID: businessID,
                cursor: _endCursor,
                length: numToFetch
            });
        }
    },
    getAll: function(resolver) {
        NotificationStore.getNotifications(NotificationStore.getCount(), resolver);
    },
    getCount: function() {
        return rangedCallbacks.getAllResources().length;
    },
    canFetchMore: function() {
        var q = pageInfo;
        return (!q || !q.hasOwnProperty('has_next_page') || q.has_next_page);
    },
    setBusinessID: function(_businessID) {
        businessID = _businessID;
    }
};
module.exports = NotificationStore;