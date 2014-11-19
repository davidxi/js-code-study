/**
 * @providesModule flattenArray
 */
function flattenArray(array) {
    var cloned = array.slice(),
        result = [];
    while (cloned.length) {
        var item = cloned.pop();
        if (Array.isArray(item)) {
            // add back to tail
            Array.prototype.push.apply(cloned, item);
        } else {
            result.push(item);
        }
    }
    return result.reverse();
}
module.exports = flattenArray;