/**
 * @providesModule arraySort
 */
var invariant = require('./invariant.js');

function arraySort(array, compareFunction) {
    invariant(Array.isArray(array));
    var cloned = array.slice();
    if (compareFunction) {
        return cloned.sort(compareFunction);
    }
    return cloned.sort();
}
module.exports = arraySort;