/**
 * @providesModule clickRefAction
 */
var Arbiter = require('./Arbiter.js');

/**
 * clickRefAction('f', eventTarget, event).coalesce_namespace('primer');
 * clickRefAction('a', linkNodeOnClicked, event).coalesce_namespace('primer');
 */
var count = 0,
    trackObjectsCached = [];

function clickRefAction(contextName, eventTarget, event, mode, memo) {
    var timestamp = Date.now();
    var evtType = event && event.type;
    memo = memo || {};
    if (!eventTarget && event) {
        eventTarget = event.getTarget();
    }

    // if same event happend in same element node within 50 ms
    if (eventTarget && mode != "FORCE") {
        for (var s = trackObjectsCached.length - 1; s >= 0 && ((timestamp - trackObjectsCached[s]._ue_ts) < 50); --s) {

            if (trackObjectsCached[s]._node == eventTarget && trackObjectsCached[s]._type == evtType) {
                return trackObjectsCached[s];
            }
        }
    }

    // if new, brodcast it
    var trackObject = new TrackObject(timestamp, count, contextName, eventTarget, evtType);
    trackObjectsCached.push(trackObject);

    while (trackObjectsCached.length > 10) {
        trackObjectsCached.shift();
    }

    Arbiter.inform(
        "ClickRefAction/new", {
            cfa: trackObject,
            node: eventTarget,
            mode: mode,
            event: event,
            extra_data: memo
        },
        Arbiter.BEHAVIOR_PERSISTENT
    );
    count++;
    return trackObject;
}

// ----------------------------------
//  TrackObject
// ----------------------------------
function TrackObject(timestamp, id, contextName, eventTarget, eventType) {
    this.ue = timestamp + '/' + id;
    this._ue_ts = timestamp;
    this._ue_count = id;
    this._context = contextName;
    this._ns = null;
    this._node = eventTarget;
    this._type = eventType;
}
TrackObject.prototype.set_namespace = function(ns) {
    this._ns = ns;
    return this;
};
TrackObject.prototype.coalesce_namespace = function(ns) {
    if (this._ns === null) {
        this._ns = ns;
    }
    return this;
};
TrackObject.prototype.add_event = function() {
    return this;
};

// ----------------------------------
//  exports
// ----------------------------------
module.exports = global.clickRefAction = clickRefAction;