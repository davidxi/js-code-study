/**
 * @providesModule Poller
 */
var ArbiterMixin = require('./ArbiterMixin');
var AsyncRequest = require('./AsyncRequest');
var CurrentUser = require('./CurrentUser');
var copyProperties = require('./copyProperties');
var emptyFunction = require('./emptyFunction');
var mixin = require('./mixin');
var setTimeoutAcrossTransitions = require('./setTimeoutAcrossTransitions');

var propsArbiter = mixin(ArbiterMixin);
for (var o in propsArbiter) {
    if (propsArbiter.hasOwnProperty(o)) {
        Poller[o] = propsArbiter[o];
    }
}
var protoArbiter = propsArbiter === null ? null : propsArbiter.prototype;
Poller.prototype = Object.create(protoArbiter);
Poller.prototype.constructor = Poller;
Poller.__superConstructor__ = propsArbiter;

function Poller(opts) {
    this._config = copyProperties({
        clearOnQuicklingEvents: true,
        setupRequest: emptyFunction,
        interval: null,
        maxRequests: Infinity,
        dontStart: false
    }, opts);
    this._handle = null;
    if (!this._config.dontStart) {
        this.start();
    }
}

Poller.prototype.start = function() {
    if (this._polling) {
        return this;
    }
    this._requests = 0;
    this.request();
    return this;
};
Poller.prototype.stop = function() {
    this._cancelRequest();
    return this;
};
Poller.prototype.mute = function() {
    this._muted = true;
    return this;
};
Poller.prototype.resume = function() {
    if (this._muted) {
        this._muted = false;
        if (this._handle === null && this._polling) {
            return this.request();
        }
    }
    return this;
};
Poller.prototype.skip = function() {
    this._skip = true;
    return this;
};
Poller.prototype.reset = function() {
    return this.stop().start();
};
Poller.prototype.request = function() {
    this._cancelRequest();
    this._polling = true;
    if (!isUserLoggedIn()) {
        return this._done();
    }
    if (this._muted) {
        return this;
    }
    if (++this._requests > this._config.maxRequests) {
        return this._done();
    }

    var request = new AsyncRequest();
    request.setIsBackgroundRequest(true);

    var isCanceled = false;
    request.setInitialHandler(function() {
        return !isCanceled;
    });

    this._cancelRequest = function() {
        isCanceled = true;
        this._cleanup();
    }.bind(this);

    request.setFinallyHandler(setupNextRequest.bind(this));
    request.setInitialHandler = emptyFunction;
    request.setFinallyHandler = emptyFunction;

    this._config.setupRequest(request, this);
    if (this._skip) {
        this._skip = false;
        setTimeout(setupNextRequest.bind(this), 0);
    } else {
        request.send();
    }
    return this;
};
Poller.prototype.isPolling = function() {
    return this._polling;
};
Poller.prototype.isMuted = function() {
    return this._muted;
};
Poller.prototype.setInterval = function(interval) {
    if (interval) {
        this._config.interval = interval;
        this.start();
    }
};
Poller.prototype.getInterval = function() {
    return this._config.interval;
};
Poller.prototype._cleanup = function() {
    if (this._handle !== null) {
        clearTimeout(this._handle);
    }
    this._handle = null;
    this._cancelRequest = emptyFunction;
    this._polling = false;
};
Poller.prototype._done = function() {
    this._cleanup();
    this.inform('done', {
        sender: this
    });
    return this;
};
Poller.MIN_INTERVAL = 2000;
copyProperties(Poller.prototype, {
    _config: null,
    _requests: 0,
    _muted: false,
    _polling: false,
    _skip: false,
    _cancelRequest: emptyFunction
});

function setupNextRequest() {
    if (!this._polling) {
        return;
    }
    if (this._requests < this._config.maxRequests) {
        var interval = this._config.interval;
        interval = typeof interval === 'function' ?
                    interval(this._requests) :
                    interval;
        interval = (interval > Poller.MIN_INTERVAL) ?
                    interval :
                    Poller.MIN_INTERVAL; // @todo: why not just use Math.max()
        if (this._config.clearOnQuicklingEvents) {
            this._handle = setTimeout(this.request.bind(this), interval);
        } else {
            this._handle = setTimeoutAcrossTransitions(this.request.bind(this), interval);
        }
    } else {
        this._done();
    }
}

function isUserLoggedIn() {
    return CurrentUser.isLoggedInNow();
}
module.exports = Poller;