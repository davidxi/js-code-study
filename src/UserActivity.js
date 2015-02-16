/**
 * @providesModule UserActivity
 */
var Arbiter = require('./Arbiter');
var Event = require('./Event');

var currentTime = Date.now();
var lastInformTime = currentTime;
var UserActivity = {
    subscribeOnce: function(listener) {
        var token = UserActivity.subscribe(function() {
            UserActivity.unsubscribe(token);
            listener();
        });
    },
    subscribe: function(listener) /*arbiter token*/ {
        return Arbiter.subscribe('useractivity/activity', listener);
    },
    unsubscribe: function(arbiterToken) {
        arbiterToken.unsubscribe();
    },
    isActive: function(duration) {
        return (new Date() - currentTime < (duration || 5000)); // @todo: would be more clear if 'currentTime' is 'lastInformTime'
    },
    getLastInformTime: function() {
        return lastInformTime;
    }
};

function resumeActive(event) {
    currentTime = Date.now();
    var duration = currentTime - lastInformTime;
    if (duration > 500) {
        lastInformTime = currentTime;
        Arbiter.inform('useractivity/activity', {
            event: event,
            idleness: duration,
            last_inform: lastInformTime
        });
    } else if (duration < -5) {
        lastInformTime = currentTime;
    }
}
Event.listen(window, 'scroll', resumeActive);
Event.listen(window, 'focus', resumeActive);
Event.listen(document.documentElement, {
    DOMMouseScroll: resumeActive,
    mousewheel: resumeActive,
    keydown: resumeActive,
    mouseover: resumeActive,
    mousemove: resumeActive,
    click: resumeActive
});
Arbiter.subscribe('Event/stop', function(event, memo) {
    resumeActive(memo.event);
});
module.exports = UserActivity;