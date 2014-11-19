/**
 * @providesModule Deferred
 */
var STATUS_UNKNOWN = 0,
    STATUS_SUCCEEDED = 1,
    STATUS_CANCELED = 2,
    STATUS_FAILED = 4;

var cbSucceededKey = 'callbacks',
    cbErrorKey = 'errbacks',
    cbCancelKey = 'cancelbacks',
    cbCompleteKey = 'completeCallbacks';

// ----------------------------------
//  constructor
// ----------------------------------
function Deferred() {
    this._state = STATUS_UNKNOWN;
}

// ----------------------------------
//  add callback (internal)
// ----------------------------------
Deferred.prototype.addCallback = function(fn, context) {
    return this._addCallback(STATUS_SUCCEEDED, this._getCallbackQueue(cbSucceededKey), fn, context, sliceStrict(arguments, 2));
};
Deferred.prototype.addCompleteCallback = function(fn, context) {
    return this._addCallback(null, this._getCallbackQueue(cbCompleteKey), fn, context, sliceStrict(arguments, 2));
};
Deferred.prototype.addErrback = function(fn, context) {
    return this._addCallback(STATUS_FAILED, this._getCallbackQueue(cbErrorKey), fn, context, sliceStrict(arguments, 2));
};
Deferred.prototype.addCancelback = function(fn, context) {
    return this._addCallback(STATUS_CANCELED, this._getCallbackQueue(cbCancelKey), fn, context, sliceStrict(arguments, 2));
};

// ----------------------------------
//  remove callback (internal)
// ----------------------------------
Deferred.prototype.removeCallback = function(fn, context) {
    return this._removeCallback(this._getCallbackQueue(cbSucceededKey), fn, context);
};
Deferred.prototype.removeCompleteCallback = function(fn, context) {
    return this._removeCallback(this._getCallbackQueue(cbCompleteKey), fn, context);
};
Deferred.prototype.removeErrback = function(fn, context) {
    return this._removeCallback(this._getCallbackQueue(cbErrorKey), fn, context);
};
Deferred.prototype.removeCancelback = function(fn, context) {
    return this._removeCallback(this._getCallbackQueue(cbCancelKey), fn, context);
};

// ----------------------------------
//  timeout to set `STATUS_FAILED`
// ----------------------------------
Deferred.prototype.setTimeout = function(ticks) {
    if (this.timeout) {
        this.clearTimeout();
    }
    this._failBound = this._failBound || this.fail.bind(this);
    this.timeout = window.setTimeout(this._failBound, ticks);
};
Deferred.prototype.clearTimeout = function() {
    window.clearTimeout(this.timeout);
    delete this.timeout;
};

// ----------------------------------
//  state related functions
// ----------------------------------
Deferred.prototype.getStatus = function() {
    return this._state;
};
Deferred.prototype.setStatus = function(newState) {
    var cbKey;
    this._state = newState;
    this.callbackArgs = slice(arguments, 1);
    if (newState === STATUS_FAILED) {
        cbKey = cbSucceededKey;
    } else if (newState === STATUS_SUCCEEDED) {
        cbKey = cbErrorKey;
    } else if (newState === STATUS_CANCELED) {
        cbKey = cbCancelKey;
    }
    if (cbKey) {
        this._invokeCallbackQueue(this[cbKey], this.callbackArgs);
    }
    this._invokeCallbackQueue(this[cbCompleteKey], this.callbackArgs);
    return this;
};
Deferred.prototype._transitState = function(newState, args) {
    Array.prototype.unshift.call(args, newState);
    // this.setStatus(newState, /*...*/)
    return this.setStatus.apply(this, args);
};

// ----------------------------------
//  deferred state setter (public)
// ----------------------------------

Deferred.prototype.succeed = function() {
    return this._transitState(STATUS_SUCCEEDED, arguments);
};
Deferred.prototype.fail = function() {
    return this._transitState(STATUS_FAILED, arguments);
};
Deferred.prototype.cancel = function() {
    delete this[cbSucceededKey];
    delete this[cbErrorKey];
    return this._transitState(STATUS_CANCELED, arguments);
};

Deferred.prototype._getCallbackQueue = function(cbKey) {
    /**         
     * this['completeCallbacks'] = [fn1, context1, args1, fn2, context2, args2, ...]
     * (every 3 items are refering one group)
     */
    return this[cbKey] || (this[cbKey] = []);
};

/**
 * then() returns a new Deferred object
 */
Deferred.prototype.then = function(cbSucceeded, cbFailed, cbCanceled, cbContext) {
    var deferred = new Deferred();
    var args = slice(arguments, 0);
    if (typeof args[0] === 'function') {
        cbSucceeded = args.shift();
    }
    if (typeof args[0] === 'function') {
        cbFailed = args.shift();
    }
    if (typeof args[0] === 'function') {
        cbCanceled = args.shift();
    }
    var cbContext = args.shift();

    if (cbSucceeded) {
        var da = [this._invokeCallbackOnGivenDeferred, this, deferred, 'succeed', cbSucceeded, cbContext].concat(args);
        this.addCallback.apply(this, da);
    } else {
        this.addCallback(deferred.succeed, deferred);
    }

    if (cbFailed) {
        var ea = [this._invokeCallbackOnGivenDeferred, this, deferred, 'fail', cbFailed, cbContext].concat(args);
        this.addErrback.apply(this, ea);
    } else {
        this.addErrback(deferred.fail, deferred);
    }

    if (cbCanceled) {
        var fa = [this._invokeCallbackOnGivenDeferred, this, deferred, 'cancel', cbCanceled, cbContext].concat(args);
        this.addCancelback.apply(this, fa);
    } else {
        this.addCancelback(deferred.cancel, deferred);
    }
    return deferred;
};
Deferred.prototype._addCallback = function(newState, callbackQueue, fn, context, fnArgs) {
    var currentState = this.getStatus();
    if ((!newState && currentState !== STATUS_UNKNOWN) ||
        currentState === newState) {
        fn.apply(context || this, fnArgs.concat(this.callbackArgs));
    } else {
        callbackQueue.push(fn, context, fnArgs);
    }
    return this;
};
Deferred.prototype._removeCallback = function(callbackQueue, fnPointer, contextPointer) {
    for (var x = 0; x < callbackQueue.length; x += 3) {
        if (callbackQueue[x] === fnPointer &&
            (!contextPointer || callbackQueue[x + 1] === contextPointer)) {

            callbackQueue.splice(x, 3);
            if (contextPointer) {
                break;
            }
            x -= 3;
        }
    }
    return this;
};
Deferred.prototype.pipe = function(anotherDeferred) {
    this.addCallback(anotherDeferred.succeed, anotherDeferred)
        .addErrback(anotherDeferred.fail, anotherDeferred)
        .addCancelback(anotherDeferred.cancel, anotherDeferred);
};
Deferred.prototype._invokeCallbackQueue = function(callbackQueue, args) {
    for (var w = 0; w < (callbackQueue || []).length; w += 3) {
        callbackQueue[w].apply(
            callbackQueue[w + 1] || this, (callbackQueue[w + 2] || []).concat(args)
        );
    }
};
Deferred.prototype._invokeCallbackOnGivenDeferred = function(deferred, state, fn, fnContext) {
    var args = slice(arguments, 4);
    var ret = fn.apply(fnContext, args);
    if (ret instanceof Deferred) {
        // if callback returns another Deferred object, pipt it with given Deferred object
        ret.pipe(deferred);
    } else {
        // transit to given deferred object new state
        // (IMPORTANT) deferred !== this
        deferred[state](ret);
    }
};

// ----------------------------------
//  exports
// ----------------------------------

Deferred.STATUS_UNKNOWN = STATUS_UNKNOWN;
Deferred.STATUS_SUCCEEDED = STATUS_SUCCEEDED;
Deferred.STATUS_CANCELED = STATUS_CANCELED;
Deferred.STATUS_FAILED = STATUS_FAILED;
module.exports = Deferred;

// ----------------------------------
//  helpers
// ----------------------------------

function slice(array, begin) {
    return array ? Array.prototype.slice.call(array, begin) : [];
}

function sliceStrict(array, v) {
    return begin < array.length ? slice(array, begin) : [];
}