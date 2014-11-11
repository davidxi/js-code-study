/**
 * @providesModule forEachObject
 */
var owns = Object.prototype.hasOwnProperty;

function forEachObject(obj, iterator, context) {
    for (var key in obj) {
        if (!owns.call(obj, key)) continue
        iterator.call(context, obj[key], key, obj);
    }

}
module.exports = forEachObject;