/**
 * @providesModule JSONPTransport
 */
var ArbiterMixin = require('./ArbiterMixin');
var DOM = require('./DOM');
var HTML = require('./HTML');
var URI = require('./URI');
var mixin = require('./mixin');

var cache = {};
function clearCachedInstance(transportId) {
    delete cache[transportId];
}

var propsArbiterMixin = mixin(ArbiterMixin);
for (var r in propsArbiterMixin) {
    if (propsArbiterMixin.hasOwnProperty(r)) {
        JSONPTransport[r] = propsArbiterMixin[r];
    }
}
var protoArbiterMixin = propsArbiterMixin === null ? null : propsArbiterMixin.prototype;
JSONPTransport.prototype = Object.create(protoArbiterMixin);
JSONPTransport.prototype.constructor = JSONPTransport;
JSONPTransport.__superConstructor__ = propsArbiterMixin;

function JSONPTransport(type, uri) {
    this._type = type;
    this._uri = uri;
    cache[this.getID()] = this;
}

var transportId = 2;
JSONPTransport.prototype.getID = function() {
    return this._id || (this._id = transportId++);
};
JSONPTransport.prototype.hasFinished = function() {
    return !(this.getID() in cache);
};
JSONPTransport.prototype.getRequestURI = function() {
    return URI(this._uri).addQueryData({
        __a: 1,
        __adt: this.getID(),
        __req: 'jsonp_' + this.getID()
    });
};
JSONPTransport.prototype.getTransportFrame = function() {
    if (this._iframe) {
        return this._iframe;
    }
    var iframeName = 'transport_frame_' + this.getID();
    var html = HTML('<iframe class="hidden_elem" name="' + iframeName + '" src="javascript:void(0)" />');
    return this._iframe = DOM.appendContent(document.body, html)[0];
};
JSONPTransport.prototype.send = function() {
    if (this._type === 'jsonp') {
        setTimeout((function() {
            DOM.appendContent(
                document.body,
                DOM.create('script', {
                    src: this.getRequestURI().toString(),
                    type: 'text/javascript'
                })
            );
        }).bind(this), 0);
    } else {
        this.getTransportFrame().src = this.getRequestURI().toString();
    }
};
JSONPTransport.prototype.handleResponse = function(response/* object */) {
    this.inform('response', response);
    if (this.hasFinished()) {
        setTimeout(this._cleanup.bind(this), 0);
    }
};
JSONPTransport.prototype.abort = function() {
    if (this._aborted) {
        return;
    }
    this._aborted = true;
    this._cleanup();
    clearCachedInstance(this.getID());
    this.inform('abort');
};
JSONPTransport.prototype._cleanup = function() {
    if (this._iframe) {
        DOM.remove(this._iframe);
        this._iframe = null;
    }
};
JSONPTransport.respond = function(transportId, response, w) {
    var transport = cache[transportId];
    if (transport) {
        if (!w) {
            clearCachedInstance(transportId);
        }
        if (transport._type == 'iframe') {
            response = JSON.parse(JSON.stringify(response));
        }
        transport.handleResponse(response);
    } else {
        if (global.ErrorSignal && !w) {
            global.ErrorSignal.logJSError('ajax', {
                error: 'UnexpectedJsonResponse',
                extra: {
                    id: transportId,
                    uri: (response.payload && response.payload.uri) || ''
                }
            });
        }
    }
};
module.exports = JSONPTransport;