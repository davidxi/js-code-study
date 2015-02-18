/**
 * @providesModule mergeObjects
 */
var copyProperties = require('./copyProperties');

function mergeObjects() {
    var dest = {};
    for (var j = 0; j < arguments.length; j++) {
        copyProperties(dest, arguments[j]);
    }
    return dest;
}
module.exports = mergeObjects;