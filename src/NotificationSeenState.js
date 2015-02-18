/**
 * @providesModule NotificationSeenState
 */
var NotificationConstants = require('./NotificationConstants');
var NotificationUpdates = require('./NotificationUpdates');
var createObjectFrom = require('./createObjectFrom');
var mergeObjects = require('./mergeObjects');

var cache = {};

var BIT_SEEN = 1;
var BIT_READ = 2;

var UNSEEN_AND_UNREAD = 0;
var SEEN_BUT_UNREAD = BIT_SEEN;
var SEEN_AND_READ = BIT_SEEN | BIT_READ;

var StateMarks = {
    UNSEEN_AND_UNREAD: UNSEEN_AND_UNREAD,
    SEEN_BUT_UNREAD: SEEN_BUT_UNREAD,
    SEEN_AND_READ: SEEN_AND_READ
};

function updateToStore(idsToStates) {
    var pendingSeen = [];
    var pendingRead = [];

    Object.keys(idsToStates).forEach(function(alertId) {
        var state = idsToStates[alertId];
        var prevState = cache[alertId];
        cache[alertId] = state;
        if (prevState === undefined) {
            pendingSeen.push(alertId);
            pendingRead.push(alertId);
            return;
        }
        // OMG ~ this bit trick here is cool ~ i love it =^.^=
        var ca = prevState ^ state;
        if (ca & BIT_SEEN) {
            pendingSeen.push(alertId);
        }
        if (ca & BIT_READ) {
            pendingRead.push(alertId);
        }
    });

    pendingSeen.length && NotificationUpdates.didUpdateSeenState(pendingSeen);
    pendingRead.length && NotificationUpdates.didUpdateReadState(pendingRead);
}

NotificationUpdates.subscribe('update-notifications', function(arbiterEvt, memo) {
    var nodes = memo.nodes;
    if (!nodes || !nodes.length) {
        return;
    }
    var isFromEndPoint = memo.payloadsource == NotificationConstants.PayloadSourceType.ENDPOINT;
    var pending = {};
    memo.nodes.forEach(function(node) {
        var alertId = node.alert_id;
        if (!isFromEndPoint || cache[alertId] === undefined) {
            pending[alertId] = StateMarks[node.seen_state];
        }
    });
    updateToStore(pending);
});
NotificationUpdates.subscribe('update-seen', function(arbiterEvt, memo) {
    if (!memo.seenState) {
        return;
    }
    var newIds = [];
    var modified = {};
    Object.keys(memo.seenState).forEach(function(alertId) {
        if (!memo.seenState[alertId]) {
            newIds.push(alertId);
            return;
        }
        var prevState = cache[alertId];
        if (prevState !== undefined) {
            modified[alertId] = prevState | BIT_SEEN;
        }
    });
    var pending = mergeObjects(createObjectFrom(newIds, UNSEEN_AND_UNREAD), modified);
    updateToStore(pending);
});
NotificationUpdates.subscribe('update-read', function(arbiterEvt, memo) {
    if (!memo.readState) {
        return;
    }
    var newIds = [];
    var modified = {};
    Object.keys(memo.readState).forEach(function(alertId) {
        if (memo.readState[alertId]) {
            newIds.push(alertId);
            return;
        }
        var prevState = cache[alertId];
        if (prevState !== undefined) {
            modified[alertId] = prevState & ~BIT_READ;
        } else if (memo.payloadsource == NotificationConstants.PayloadSourceType.INITIAL_LOAD) {
            modified[alertId] = SEEN_BUT_UNREAD;
        }
    });
    var pending = mergeObjects(createObjectFrom(newIds, SEEN_AND_READ), modified);
    updateToStore(pending);
});

function getState(alertId) {
    return cache[alertId];
}

var NotificationSeenState = {
    isRead: function(alertId) {
        return getState(alertId) === SEEN_AND_READ;
    },
    isSeen: function(alertId) {
        return getState(alertId) !== UNSEEN_AND_UNREAD;
    },
    getUnseenCount: function() {
        return NotificationSeenState.getUnseenIDs().length;
    },
    getUnseenIDs: function() {
        return Object.keys(cache).filter(function(alertId) {
            return cache[alertId] === UNSEEN_AND_UNREAD;
        });
    },
    getUnreadCount: function() {
        return NotificationSeenState.getUnreadIDs().length;
    },
    getUnreadIDs: function() {
        return Object.keys(cache).filter(function(alertId) {
            return cache[alertId] !== SEEN_AND_READ;
        });
    }
};
module.exports = NotificationSeenState;