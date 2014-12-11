/**
 * @providesModule createObjectFrom
 */
function createObjectFrom(array, def) {
    var obj = {};
    var isArray = Array.isArray(def);
    // to be compatible with keyMap
    if (typeof def == 'undefined') {
        def = true;
    }
    for (var l = array.length; l--;) {
        obj[array[l]] = isArray ? def[l] : def;
    }
    return obj;
}
module.exports = createObjectFrom;