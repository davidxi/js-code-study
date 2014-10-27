/**
 * @providesModule ErrorUtils
 */
var Env = require('./Env.js');
var eprintf = require('./eprintf.js');
var erx = require('./erx.js');
var wrapFunction = require('./wrapFunction.js');

var k = {},
    ANONYMOUS_GUARD_TAG = '<anonymous guard>',
    GENERATED_GUARD_TAG = '<generated guard>',
    GLOBAL_ERROR_HANDLER_TAG = '<window.onerror>',
    REGEXP_HTTPS = /^https?:\/\//i,
    REGEXP_TYPE_MISTATCH = /^Type Mismatch for/,
    q = ['Unknown script code', 'Function code', 'eval code'],
    REGEXP_ERROR_IN_EVAL = new RegExp('(.*?)(\\s)(?:' + q.join('|') + ')$'),
    errorListeners = [],
    sourceResolver,
    history = [],
    historyCountLimit = 50,
    guardTagStack = [],
    isInGuard = false,
    inReportingError = false;

function getStackFrames(error) {
    if (!error)
        return [];
    var frames = error.split(/\n\n/)[0].replace(/[\(\)]|\[.*?\]|^\w+:\s.*?\n/g, '').split('\n').map(function(errMsg) {
        var oa, pa, qa;
        errMsg = errMsg.trim();
        if (/(:(\d+)(:(\d+))?)$/.test(errMsg)) {
            pa = RegExp.$2;
            qa = RegExp.$4;
            errMsg = errMsg.slice(0, -RegExp.$1.length);
        }
        if (REGEXP_ERROR_IN_EVAL.test(errMsg) || /(.*)(@|\s)[^\s]+$/.test(errMsg)) {
            errMsg = errMsg.substring(RegExp.$1.length + 1);
            oa = /(at)?\s*(.*)([^\s]+|$)/.test(RegExp.$1) ? RegExp.$2 : '';
        }
        var errorInSourceInfo = {
            identifier: oa,
            script: errMsg,
            line: pa,
            column: qa
        };
        if (sourceResolver) {
            sourceResolver(errorInSourceInfo);
        }
        errorInSourceInfo.text = '    at' +
			(errorInSourceInfo.identifier ? ' ' + errorInSourceInfo.identifier + ' (' : ' ') +
			errorInSourceInfo.script +
			(errorInSourceInfo.line ? ':' + errorInSourceInfo.line : '') +
			(errorInSourceInfo.column ? ':' + errorInSourceInfo.column : '') +
			(errorInSourceInfo.identifier ? ')' : '');
        return errorInSourceInfo;
    });
    return frames;
}

function normalizeError(error) {
    if (!error) {
        return {};
    } else if (error._originalError)
        return error;
    var stackFrames = getStackFrames(error.stackTrace || error.stack),
        hasFramesPopped = false;
    if (error.framesToPop) {
        var oa = error.framesToPop,
            stackFrame;
        while (oa > 0 && stackFrames.length > 0) {
            stackFrame = stackFrames.shift();
            oa--;
            hasFramesPopped = true;
        }
        if (REGEXP_TYPE_MISTATCH.test(error.message) && error.framesToPop === 2 && stackFrame)
            if (REGEXP_HTTPS.test(stackFrame.script))
                error.message += ' at ' + stackFrame.script + (stackFrame.line ? ':' + stackFrame.line : '') + (stackFrame.column ? ':' + stackFrame.column : '');
        delete error.framesToPop;
    }
    var normalizedError = {
        line: error.lineNumber || error.line,
        column: error.columnNumber || error.column,
        name: error.name,
        message: error.message,
        messageWithParams: error.messageWithParams,
        type: error.type,
        script: error.fileName || error.sourceURL || error.script,
        stack: stackFrames.map(function(sa) {
            return sa.text;
        }).join('\n'),
        stackFrames: stackFrames,
        guard: error.guard,
        guardList: error.guardList,
        extra: error.extra,
        snapshot: error.snapshot
    };
    if (typeof normalizedError.message === 'string' && !normalizedError.messageWithParams) {

        normalizedError.messageWithParams = erx(normalizedError.message);
        normalizedError.message = eprintf.apply(global, normalizedError.messageWithParams);
    } else {
        normalizedError.messageObject = normalizedError.message;
        normalizedError.message = String(normalizedError.message);
    }
    if (sourceResolver)
        sourceResolver(normalizedError);
    if (hasFramesPopped) {
        delete normalizedError.script;
        delete normalizedError.line;
        delete normalizedError.column;
    }
    if (stackFrames[0]) {
        normalizedError.script = normalizedError.script || stackFrames[0].script;
        normalizedError.line = normalizedError.line || stackFrames[0].line;
        normalizedError.column = normalizedError.column || stackFrames[0].column;
    }
    normalizedError._originalError = error;

    for (var ra in normalizedError)
        (normalizedError[ra] == null && delete normalizedError[ra]);

    return normalizedError;
}

function reportError(error, ma) {
    if (inReportingError)
        return false;
    if (guardTagStack.length > 0) {
        error.guard = error.guard || guardTagStack[0];
        error.guardList = guardTagStack.slice();
    }
    error = normalizeError(error);
    !ma;
    if (history.length > historyCountLimit)
        history.splice(historyCountLimit / 2, 1);
    history.push(error);
    inReportingError = true;
    for (var i = 0; i < errorListeners.length; i++)
        try {
            errorListeners[i](error);
        } catch (err) {}
    inReportingError = false;
    return true;
}

function inGuard() {
    return isInGuard;
}

function pushGuardTag(guardTag) {
    guardTagStack.unshift(guardTag);
    isInGuard = true;
}

function popGuardTag() {
    guardTagStack.shift();
    isInGuard = (guardTagStack.length !== 0);
}

function applyWithGuard(fn, context, args, oa, guardTag) {
    pushGuardTag(guardTag || ANONYMOUS_GUARD_TAG);
    var ret;
    var isNocatchMode = k.nocatch || (/nocatch/).test(location.search);
    if (!isNocatchMode && Env.nocatch)
        isNocatchMode = Env.nocatch;
    if (isNocatchMode) {
        try {
            ret = fn.apply(context, args || []);
        } finally {
            popGuardTag();
        }
        return ret;
    }
    try {
        ret = fn.apply(context, args || []);
        return ret;
    } catch (err) {
        var normalizedError = normalizeError(err);
        if (oa)
            oa(normalizedError);
        if (fn)
            normalizedError.callee = fn.toString().substring(0, 100);
        if (args)
            normalizedError.args = Array.prototype.slice.call(args).toString().substring(0, 100);
        normalizedError.guard = guardTagStack[0];
        normalizedError.guardList = guardTagStack.slice();
        reportError(normalizedError);
    } finally {
        popGuardTag();
    }
}

function guard(fn, guardTag, context) {
    guardTag = guardTag || fn.name || GENERATED_GUARD_TAG;

    function fnBound() {
        return applyWithGuard(fn, context || this, arguments, null, guardTag);
    }
    return fnBound;
}

/**
 * other modules can use `wrapFunction(fn, 'entry')` to mix in guard()
 */
wrapFunction.setWrapper(guard, 'entry');

function onerror(la, ma, na, oa, pa) {
    pa = pa || {};
    pa.message = pa.message || la;
    pa.script = pa.script || ma;
    pa.line = pa.line || na;
    pa.column = pa.column || oa;
    pa.guard = GLOBAL_ERROR_HANDLER_TAG;
    pa.guardList = [GLOBAL_ERROR_HANDLER_TAG];
    reportError(pa, true);
}
window.onerror = onerror;

function addListener(listener, isNotRetroactive) {
    errorListeners.push(listener);
    if (!isNotRetroactive)
        history.forEach(listener);
}

function setSourceResolver(resolver) {
    sourceResolver = resolver;
}

/**
 * exports
 */
var ErrorUtils = {
    ANONYMOUS_GUARD_TAG: ANONYMOUS_GUARD_TAG,
    GENERATED_GUARD_TAG: GENERATED_GUARD_TAG,
    GLOBAL_ERROR_HANDLER_TAG: GLOBAL_ERROR_HANDLER_TAG,
    addListener: addListener,
    setSourceResolver: setSourceResolver,
    applyWithGuard: applyWithGuard,
    guard: guard,
    history: history,
    inGuard: inGuard,
    normalizeError: normalizeError,
    onerror: onerror,
    reportError: reportError
};

module.exports = global.ErrorUtils = ErrorUtils;