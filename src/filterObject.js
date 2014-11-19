/**
 * @providesModule filterObject
 */
var owns = Object.prototype.hasOwnProperty;

function filterObject(obj, filter, context) {
    if (!obj) {
        return null;
    }
    var filtered = {};
    for (var m in obj) {
        if (owns.call(obj, m) && filter.call(context, obj[m], m, obj)) {
            filtered[m] = obj[m];
        }
    }
    return filtered;
}
module.exports = filterObject;