/**
 * @providesModule LiveTimer
 */
var CSS = require('./CSS');
var DOM = require('./DOM');
var ServerTime = require('./ServerTime');
var fbt = require('./fbt');

var MS_IN_SEC = 1000;
var SEC_IN_MIN = 60;
var SEC_IN_HOUR = 3600;
var SEC_IN_12_HOUR = 43200;
var SEC_IN_24_HOUR = 86400;
var MIN_IN_HOUR = 60;
var HEARTBEAT = 20000;

var LiveTimer = {
    restart: function(seconds) {
        ServerTime.update(seconds * MS_IN_SEC);
        this.updateTimeStamps();
    },
    getApproximateServerTime: function() {
        return ServerTime.get();
    },
    getServerTimeOffset: function() {
        return -1 * ServerTime.getOffsetMillis();
    },
    updateTimeStamps: function() {
        this.timestamps = DOM.scry(document.body, 'abbr.livetimestamp');
        this.startLoop(HEARTBEAT);
    },
    addTimeStamps: function(timestampNode) {
        if (!timestampNode) {
            return;
        }
        this.timestamps = this.timestamps || [];
        if (DOM.isNodeOfType(timestampNode, 'abbr') && CSS.hasClass(timestampNode, 'livetimestamp')) {
            this.timestamps.push(timestampNode);
        } else {
            var timestampChildren = DOM.scry(timestampNode, 'abbr.livetimestamp');
            for (var u = 0; u < timestampChildren.length; ++u) {
                this.timestamps.push(timestampChildren[u]);
            }
        }
        this.startLoop(0);
    },
    startLoop: function(delay) {
        this.stop();
        this.timeout = setTimeout(function() {
            this.loop();
        }.bind(this), delay);
    },
    stop: function() {
        clearTimeout(this.timeout);
    },
    loop: function(isUpdateTimeStampNodes) {
        if (isUpdateTimeStampNodes) {
            this.updateTimeStamps();
        }

        var currentSecond = Math.floor(ServerTime.get() / MS_IN_SEC);
        var nextCheckTime = -1;

        this.timestamps && this.timestamps.forEach(function(timestamp) {
            var utime = timestamp.getAttribute('data-utime');
            var shorten = timestamp.getAttribute('data-shorten');
            var label = this.renderRelativeTime(currentSecond, utime, shorten);
            if (label.text) {
                DOM.setContent(timestamp, label.text);
            }
            // update global next shortest check time
            if (label.next != -1 && (label.next < nextCheckTime || nextCheckTime == -1)) {
                nextCheckTime = label.next;
            }
        }.bind(this));

        if (nextCheckTime != -1) {
            var delay = Math.max(HEARTBEAT, nextCheckTime * MS_IN_SEC);
            this.timeout = setTimeout(function() {
                this.loop();
            }.bind(this), delay);
        }
    },
    renderRelativeTime: function(currentSecond, utime, shorten) {
        var label = {
            text: "",
            next: -1
        };
        if (currentSecond - utime > SEC_IN_24_HOUR) {
            return label;
        }
        var elapsedSeconds = currentSecond - utime;
        var elapsedMinutes = Math.floor(elapsedSeconds / SEC_IN_MIN);
        var elapsedHours = Math.floor(elapsedMinutes / MIN_IN_HOUR);
        if (elapsedMinutes < 1) {
            if (shorten) {
                label.text = "Just now";
                label.next = 20 - elapsedSeconds % 20;
            } else {
                label.text = "a few seconds ago";
                label.next = SEC_IN_MIN - elapsedSeconds % SEC_IN_MIN;
            }
            return label;
        }
        if (elapsedHours < 1) {
            if (shorten && elapsedMinutes == 1) {
                label.text = "1 min";
            } else if (shorten) {
                label.text = fbt._("{number} mins", [fbt.param("number", elapsedMinutes)]);
            } else {
                label.text =
                  elapsedMinutes == 1 ?
                    "about a minute ago" :
                    fbt._("{number} minutes ago", [fbt.param("number", elapsedMinutes)]);
            }
            label.next = SEC_IN_MIN - elapsedSeconds % SEC_IN_MIN;
            return label;
        }
        if (elapsedHours < 11) {
            label.next = SEC_IN_HOUR - elapsedSeconds % SEC_IN_HOUR;
        }
        if (shorten && elapsedHours == 1) {
            label.text = "1 hr";
        } else if (shorten) {
            label.text = fbt._("{number} hrs", [fbt.param("number", elapsedHours)]);
        } else {
            label.text =
              elapsedHours == 1 ?
                "about an hour ago" :
                fbt._("{number} hours ago", [fbt.param("number", elapsedHours)]);
        }
        return label;
    },
    renderRelativeTimeToServer: function(utime, shorten) {
        return this.renderRelativeTime(Math.floor(ServerTime.get() / MS_IN_SEC), utime, shorten);
    }
};
module.exports = LiveTimer;
module.exports.CONSTS = {
    MS_IN_SEC: MS_IN_SEC,
    SEC_IN_MIN: SEC_IN_MIN,
    SEC_IN_HOUR: SEC_IN_HOUR,
    SEC_IN_12_HOUR: SEC_IN_12_HOUR,
    SEC_IN_24_HOUR: SEC_IN_12_HOUR,
    MIN_IN_HOUR: MIN_IN_HOUR,
    HEARTBEAT: HEARTBEAT
};