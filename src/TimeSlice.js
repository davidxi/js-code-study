/**
 * @providesModule TimeSlice
 */
var ErrorUtils = require('./ErrorUtils');
var LogBuffer = require('./LogBuffer');
var invariant = require('./invariant');
var performanceAbsoluteNow = require('./performanceAbsoluteNow');
var wrapFunction = require('./wrapFunction');

var inGuard = false;
var currentGuardTag;
var queue = [];
var depth;
var TimeSlice = {
    guard: function(fn, guardTag) {
        var sliceGuardTag = 'TimeSlice' + (guardTag ? ': ' + guardTag : '');
        var taskGuardTag = 'TimeSlice Task' + (guardTag ? ': ' + guardTag : '');
        return function() {
            var startTime = performanceAbsoluteNow();
            if (inGuard) {
                return fn.apply(this, arguments);
            }
            inGuard = true;
            currentGuardTag = guardTag;
            queue.length = 0;
            depth = 0;
            var fnWithGuard = ErrorUtils.applyWithGuard(fn, this, arguments, null, sliceGuardTag);
            while (queue.length > 0) {
                var queued = queue.shift();
                depth = queued.depth;
                ErrorUtils.applyWithGuard(queued.fn, global, null, null, taskGuardTag);
            }
            inGuard = false;
            var endTime = performanceAbsoluteNow();
            LogBuffer.write('time_slice', Object.assign({
                begin: startTime,
                end: endTime,
                guard: guardTag
            }, fn.__SMmeta));
            return fnWithGuard;
        };
    },
    enqueue: function(fn) {
        invariant(inGuard);
        invariant(depth < 1000);
        queue.push({
            fn: fn,
            depth: depth + 1
        });
    },
    inGuard: function() {
        return inGuard;
    }
};
wrapFunction.setWrapper(TimeSlice.guard, 'entry');
global.TimeSlice = TimeSlice;
module.exports = TimeSlice;