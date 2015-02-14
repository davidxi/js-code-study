/**
 * @providesModule uniqueID
 */
var prefix = 'js_';
var count = 0;

function uniqueID() {
    return prefix + (count++).toString(36);
}
module.exports = uniqueID;