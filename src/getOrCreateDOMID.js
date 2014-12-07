/**
 * @providesModule getOrCreateDOMID
 */
var uniqueID = require('uniqueID');

function getOrCreateDOMID(elem) {
    if (!elem.id) {
        elem.id = uniqueID();
    }
    return elem.id;
}
module.exports = getOrCreateDOMID;