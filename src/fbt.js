/**
 * @providesModule fbt
 */
var copyProperties = require('./copyProperties');
var substituteTokens = require('./substituteTokens');
var invariant = require('./invariant');
var FbtLogger = require('./FbtLogger').logger;
var FbtQTOverrides = require('./FbtQTOverrides').overrides;

var fbt = function() {};

fbt._ = function(template, params) {
    var data = {};
    var tmpl = template;

    if (params !== undefined) {
        for (var r = 0; r < params.length; r++) {
            var param = params[r];
            var index = param[0];
            if (index !== null) {
                invariant(index in tmpl);
                tmpl = tmpl[index];
            }
            copyProperties(data, param[1]);
        }
    }
    if (typeof tmpl === 'string') {
        return substituteTokens(tmpl, data);
    } else if (Array.isArray(tmpl)) {
        var _tmpl = tmpl[0];
        var u = tmpl[1];
        _tmpl = FbtQTOverrides[u] || _tmpl;
        fbt.logImpression(u);
        return substituteTokens(_tmpl, data);
    } else {
        invariant(false);
    }
};
fbt['enum'] = function(n) {
    return [n, null];
};
fbt.param = function(key, val) {
    var param = {};
    param[key] = val;
    return [null, param];
};
fbt.logImpression = function(n) {
    if (FbtLogger) {
        FbtLogger.logImpression(n);
    }
    return n;
};
module.exports = fbt;