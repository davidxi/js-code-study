/**
 * @providesModule copyProperties
 */
// This is a shallow copy. It mutates the first object and also returns it.
function copyProperties(obj, a, b, c, d, e, f) {
    obj = obj || {};

    if (f) {
        // up to 5 to-copy object
        throw new Error('Too many arguments passed to copyProperties');
    }

    var args = [a, b, c, d, e];
    var ii = 0,
        v;
    while (args[ii]) {
        v = args[ii++];
        for (var k in v) {
            obj[k] = v[k];
        }

        // IE ignores toString in object iteration.. See:
        // webreflection.blogspot.com/2007/07/quick-fix-internet-explorer-and.html
        if (v.hasOwnProperty && v.hasOwnProperty('toString') &&
            (typeof v.toString !== 'undefined') && (obj.toString !== v.toString)) {
            obj.toString = v.toString;
        }
    }

    return obj;
}

module.exports = copyProperties;