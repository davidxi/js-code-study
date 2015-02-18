/**
 * @providesModule NotificationUpdates
 */
var Arbiter = require('./Arbiter');
var ChannelConstants = require('./ChannelConstants');
var JSLogger = require('./JSLogger');
var NotificationConstants = require('./NotificationConstants');
var NotificationTokens = require('./NotificationTokens');
var LiveTimer = require('./LiveTimer');
var copyProperties = require('./copyProperties');
var createObjectFrom = require('./createObjectFrom');

var notificationsCached = {};
var seenCached = {};
var readCached = {};
var hiddenCached = {};
var dispatcherEvents = [];
var inInformProgress = 0;
var logger = JSLogger.create('notification_updates');

function broadcastState() {
    if (inInformProgress) {
        return;
    }

    var _notificationsCached = notificationsCached;
    var _seenCached = seenCached;
    var _readCached = readCached;
    var _hiddenCached = hiddenCached;
    notificationsCached = {};
    seenCached = {};
    readCached = {};
    hiddenCached = {};

    broadcast('notifications-updated', _notificationsCached);
    if (Object.keys(_seenCached).length) {
        broadcast('seen-state-updated', _seenCached);
    }
    if (Object.keys(_readCached).length) {
        broadcast('read-state-updated', _readCached);
    }
    if (Object.keys(_hiddenCached).length) {
        broadcast('hidden-state-updated', _hiddenCached);
    }
    dispatcherEvents.pop();
}

function getCurrentDispatcherEvent() {
    if (dispatcherEvents.length) {
        return dispatcherEvents[dispatcherEvents.length - 1];
    }
    return NotificationConstants.PayloadSourceType.UNKNOWN;
}

function broadcast(event, data) {
    NotificationUpdates.inform(event, {
        updates: data,
        source: getCurrentDispatcherEvent()
    });
}

Arbiter.subscribe(ChannelConstants.getArbiterType('notification_json'), function(arbiterEvt, memo) {
    var now = Date.now();
    var nodes = memo.obj.nodes;
    if (nodes) {
        nodes.forEach(function(node) {
            node.receivedTime = now;
        });
        logger.debug('notifications_received', nodes);
        NotificationUpdates.handleUpdate(NotificationConstants.PayloadSourceType.LIVE_SEND, memo.obj);
    }
});
Arbiter.subscribe(ChannelConstants.getArbiterType('notifications_seen'), function(z, memo) {
    var alertIds = NotificationTokens.tokenizeIDs(memo.obj.alert_ids);
    NotificationUpdates.handleUpdate(NotificationConstants.PayloadSourceType.LIVE_SEND, {
        seenState: createObjectFrom(alertIds)
    });
});
Arbiter.subscribe(ChannelConstants.getArbiterType('notifications_read'), function(z, memo) {
    var alertIds = NotificationTokens.tokenizeIDs(memo.obj.alert_ids);
    NotificationUpdates.handleUpdate(NotificationConstants.PayloadSourceType.LIVE_SEND, {
        readState: createObjectFrom(alertIds)
    });
});

var NotificationUpdates = copyProperties(new Arbiter(), {
    handleUpdate: function(dispatcherEvt /* Flux evt type */ , memo) {
        if (memo.servertime) {
            LiveTimer.restart(memo.servertime);
        }
        if (Object.keys(memo).length) {

            this.synchronizeInforms(function() {
                dispatcherEvents.push(dispatcherEvt);

                var payload = copyProperties({
                    payloadsource: getCurrentDispatcherEvent()
                }, memo);

                this.inform('update-notifications', payload);
                this.inform('update-seen', payload);
                this.inform('update-read', payload);
                this.inform('update-hidden', payload);
            }.bind(this));
        }
    },
    didUpdateNotifications: function(z) {
        copyProperties(notificationsCached, createObjectFrom(z));
        broadcastState();
    },
    didUpdateSeenState: function(z) {
        copyProperties(seenCached, createObjectFrom(z));
        broadcastState();
    },
    didUpdateReadState: function(z) {
        copyProperties(readCached, createObjectFrom(z));
        broadcastState();
    },
    didUpdateHiddenState: function(z) {
        copyProperties(hiddenCached, createObjectFrom(z));
        broadcastState();
    },
    synchronizeInforms: function(informFn) {
        inInformProgress++;
        try {
            informFn();
        } catch (err) {
            throw err;
        } finally {
            inInformProgress--;
            broadcastState();
        }
    }
});
module.exports = NotificationUpdates;