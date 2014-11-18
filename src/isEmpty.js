/**
 * @providesModule isEmpty
 */
function isEmpty(h) {
    if (Array.isArray(h)) {
        return h.length === 0;
    } else if (typeof h === 'object') {
        for (var i in h) // why not use hasOwnProperty() ?
            return false;
        return true;
    } else
        return !h;
}
module.exports = isEmpty;