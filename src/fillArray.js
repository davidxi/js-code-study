/**
 * @providesModule fillArray
 */
function fillArray(len, def) {
    var array = new Array(len);
    for (var k = 0; k < len; k++)
        array[k] = def;
    return array;
}
module.exports = fillArray;