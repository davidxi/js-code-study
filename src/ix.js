/**
 * @providesModule ix
 */
var invariant = require('invariant');

var cache = {};

function ix(key) {
    var val = cache[key];
    invariant(!!val);
    return val;
}
ix.add = function(obj) {
    for (var l in obj) {
        if (!(l in cache)) {
            cache[l] = obj[l];
        }
    }
};
module.exports = ix;