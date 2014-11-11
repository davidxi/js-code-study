/**
 * @providesModule ArbiterMixin
 */
var Arbiter = require('./Arbiter.js');
var guid = require('./guid.js');

var uid = "arbiter$" + guid();
var owns = Object.prototype.hasOwnProperty;

var ArbiterMixin = {
    _getArbiterInstance: function() {
        return owns.call(this, uid) ?
                this[uid] :
                this[uid] = new Arbiter();
    },
    inform: function(l, m, n) {
        return this._getArbiterInstance().inform(l, m, n);
    },
    subscribe: function(l, m, n) {
        return this._getArbiterInstance().subscribe(l, m, n);
    },
    subscribeOnce: function(l, m, n) {
        return this._getArbiterInstance().subscribeOnce(l, m, n);
    },
    unsubscribe: function(l) {
        this._getArbiterInstance().unsubscribe(l);
    },
    unsubscribeCurrentSubscription: function() {
        this._getArbiterInstance().unsubscribeCurrentSubscription();
    },
    releaseCurrentPersistentEvent: function() {
        this._getArbiterInstance().releaseCurrentPersistentEvent();
    },
    registerCallback: function(l, m) {
        return this._getArbiterInstance().registerCallback(l, m);
    },
    query: function(l) {
        return this._getArbiterInstance().query(l);
    }
};

module.exports = ArbiterMixin;