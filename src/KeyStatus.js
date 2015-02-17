/**
 * @providesModule KeyStatus
 */
var Event = require('./Event');
var ExecutionEnvironment = require('./ExecutionEnvironment');

var keyCode = null;
var onBlurSubscription = null;

function subscribeBlurEvent() {
    if (!onBlurSubscription) {
        onBlurSubscription = Event.listen(window, 'blur', function() {
            keyCode = null;
            unsubscribeBlurEvent();
        });
    }
}

function unsubscribeBlurEvent() {
    if (onBlurSubscription) {
        onBlurSubscription.remove();
        onBlurSubscription = null;
    }
}

function onKeyDown(event) {
    keyCode = Event.getKeyCode(event);
    subscribeBlurEvent();
}

function onKeyUp() {
    keyCode = null;
    unsubscribeBlurEvent();
}

if (ExecutionEnvironment.canUseDOM) {
    var docRoot = document.documentElement;
    if (docRoot.addEventListener) {
        docRoot.addEventListener('keydown', onKeyDown, true);
        docRoot.addEventListener('keyup', onKeyUp, true);
    } else {
        docRoot.attachEvent('onkeydown', onKeyDown);
        docRoot.attachEvent('onkeyup', onKeyUp);
    }
}

var KeyStatus = {
    isKeyDown: function() {
        return !!keyCode;
    },
    getKeyDownCode: function() {
        return keyCode;
    }
};
module.exports = KeyStatus;