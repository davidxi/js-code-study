/**
 * @providesModule StopwatchPool
 */
var Stopwatch = require('./Stopwatch');

var total = 0;
var recycled = [];
var current = {};

var StopwatchPool = {
    acquire: function() {
        var stopWatch;
        if (recycled.length > 0) {
            stopWatch = recycled.pop();
        } else {
            total++;
            stopWatch = new Stopwatch();
            stopWatch.__index = total;
        }
        current[stopWatch.__index] = stopWatch;
        return stopWatch;
    },
    release: function(stopWatch /*instance*/ ) {
        if (stopWatch.__index && current[stopWatch.__index] === stopWatch) {
            delete current[stopWatch.__index];
            recycled.push(stopWatch);
        }
    }
};
module.exports = StopwatchPool;