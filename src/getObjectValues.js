/**
 * @providesModule getObjectValues
 */
function getObjectValues(obj) /*array*/ {
    var values = [];
    for (var j in obj) {
        values.push(obj[j]);
    }
    return values;
}
module.exports = getObjectValues;