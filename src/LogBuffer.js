/**
 * @providesModule LogBuffer
 */
var CircularBuffer = require('./CircularBuffer');
var setImmediatePolyfill = require('./setImmediatePolyfill');

var MAX_LEN = 5000;
var logBuffers = {};
var tailFns = {};

var LogBuffer = {
    write: function(key, log) {
        logBuffers[key] = logBuffers[key] || new CircularBuffer(MAX_LEN);
        var buffer = logBuffers[key];

        buffer.write(log);

        if (tailFns[key]) {
            tailFns[key].forEach(function(tailFn) {
                try {
                    tailFn(log);
                } catch (q) {}
            });
        }
    },
    read: function(key) {
        if (!logBuffers[key]) {
            return [];
        } else {
            return logBuffers[key].read();
        }
    },
    tail: function(key, tailFn) {
        if (typeof tailFn !== 'function') {
            return;
        }

        tailFns[key] = tailFns[key] || [];
        tailFns[key].push(tailFn);

        // retroactive listener
        if (logBuffers[key]) {
            var buffer = logBuffers[key];
            buffer.read().forEach(function(log) {
                try {
                    tailFn(log);
                } catch (q) {}
            });
        }
    },
    clear: function(key) {
        if (logBuffers[key]) {
            setImmediatePolyfill(function() {
                logBuffers[key].clear();
            });
        }
    }
};
module.exports = LogBuffer;