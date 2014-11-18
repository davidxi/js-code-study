/**
 * @providesModule Run
 */
var Arbiter = require('./Arbiter.js');
var ExecutionEnvironment = require('./ExecutionEnvironment.js');
var OnloadEvent = require('./OnloadEvent.js');

var onUnloadEvent = 'onunloadhooks',
    onAfterUnloadEvent = 'onafterunloadhooks',
    informBehaviorState = Arbiter.BEHAVIOR_STATE;

function setLoggerTimeStamp(timeStampId) {
    if (global.CavalryLogger) {
        global.CavalryLogger.getInstance().setTimeStamp(timeStampId);
    }
}

function registerOnloadHooks(ca) {
    var globalOnLoadHooks = global.OnloadHooks;
    if (window.loaded && globalOnLoadHooks) {
        globalOnLoadHooks.runHook(ca, 'onlateloadhooks');
    } else {
        registerGlobalHooks('onloadhooks', ca);
    }
}

function registerAfterOnloadHooks(ca) {
    var globalOnLoadHooks = global.OnloadHooks;
    if (window.afterloaded && globalOnLoadHooks) {
        setTimeout(function() {
            globalOnLoadHooks.runHook(ca, 'onlateafterloadhooks');
        }, 0);
    } else {
        registerGlobalHooks('onafterloadhooks', ca);
    }
}

function registerOnBeforeUnloadHooks(ca, da) {
    if (da === undefined) {
        da = !window.loading_page_chrome;
    }
    if (da) {
        registerGlobalHooks('onbeforeleavehooks', ca);
    } else {
        registerGlobalHooks('onbeforeunloadhooks', ca);
    }
}

function _registerUnloadHooks(eventType, da) {
    // set unload event dispatcher
    if (!window.onunload) {
        window.onunload = function() {
            Arbiter.inform(OnloadEvent.ONUNLOAD, true, informBehaviorState);
        };
    }
    registerGlobalHooks(eventType, da);
}

function registerOnUnloadHooks(ca) {
    _registerUnloadHooks(onUnloadEvent, ca);
}

function registerAfterUnloadHooks(ca) {
    _registerUnloadHooks(onAfterUnloadEvent, ca);
}

function registerOnLeaveHooks(ca) {
    registerGlobalHooks('onleavehooks', ca);
}

function registerGlobalHooks(eventType, da) {
    window[eventType] = (window[eventType] || []).concat(da);
}

function removeGlobalHooks(eventType) {
    window[eventType] = [];
}

// ----------------------------------
//  register onload/ondomready event dispatcher
// ----------------------------------

function onDOMReadyEventDispatcher() {
    Arbiter.inform(OnloadEvent.ONLOAD_DOMCONTENT, true, informBehaviorState);
}
global._domcontentready = onDOMReadyEventDispatcher;

function setupOnLoadAndOnDOMReadyDispatchers() {
    var ca = document,
        da = window;
    if (document.addEventListener) {
        var ea = /AppleWebKit.(\d+)/.exec(navigator.userAgent);
        if (ea && ea[1] < 525) {
            var fa = setInterval(function() {
                if (/loaded|complete/.test(document.readyState)) {
                    onDOMReadyEventDispatcher();
                    clearInterval(fa);
                }
            }, 10);
        } else {
            document.addEventListener("DOMContentLoaded", onDOMReadyEventDispatcher, true);
        }
    } else {
        var ga = 'javascript:void(0)';
        if (window.location.protocol == 'https:') {
            ga = '//:';
        }
        /**
         * add onDOMReadyEventDispatcher() to a dummy js node onreadystate
         */
        document.write('<script onreadystatechange="if (this.readyState==\'complete\') {' + 'this.parentNode.removeChild(this);_domcontentready();}" ' + 'defer="defer" src="' + ga + '"><\/script\>');
    }
    var origOnload = window.onload;
    window.onload = function() {
        setLoggerTimeStamp('t_layout');
        origOnload && origOnload();
        Arbiter.inform(OnloadEvent.ONLOAD, true, informBehaviorState);
    };
    window.onbeforeunload = function() {
        var memo = {};
        Arbiter.inform(OnloadEvent.ONBEFOREUNLOAD, memo, informBehaviorState);
        if (!memo.warn) {
            Arbiter.inform('onload/exit', true);
        }
        return memo.warn;
    };
}

var onLoadArbiterToken = Arbiter.registerCallback(function() {
    setLoggerTimeStamp('t_onload');
    Arbiter.inform(OnloadEvent.ONLOAD_CALLBACK, true, informBehaviorState);
}, [OnloadEvent.ONLOAD]);

var onDOMReadyArbiterToken = Arbiter.registerCallback(function() {
    setLoggerTimeStamp('t_domcontent');
    var memo = {
        timeTriggered: Date.now()
    };
    Arbiter.inform(OnloadEvent.ONLOAD_DOMCONTENT_CALLBACK, memo, informBehaviorState);
}, [OnloadEvent.ONLOAD_DOMCONTENT]);

if (ExecutionEnvironment.canUseDOM) {
    setupOnLoadAndOnDOMReadyDispatchers();
}

// ----------------------------------
//  exports
// ----------------------------------

var Run = {
    onLoad: registerOnloadHooks,
    onAfterLoad: registerAfterOnloadHooks,
    onLeave: registerOnLeaveHooks,
    onBeforeUnload: registerOnBeforeUnloadHooks,
    onUnload: registerOnUnloadHooks,
    onAfterUnload: registerAfterUnloadHooks,
    __domContentCallback: onDOMReadyArbiterToken,
    __onloadCallback: onLoadArbiterToken,
    __removeHook: removeGlobalHooks
};
module.exports = Run;