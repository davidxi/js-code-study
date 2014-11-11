/**
 * @providesModule removeFromArray
 */
function removeFromArray(array, needle) {
    var pos = array.indexOf(needle);
    pos != -1 && array.splice(pos, 1);
}

module.exports = removeFromArray;