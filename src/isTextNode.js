/**
 * @providesModule isTextNode
 */
var isNode = require('./isNode.js');

/**
 * @param {*} object The object to check.
 * @return {boolean} Whether or not the object is a DOM text node.
 */
function isTextNode(object) {
    return isNode(object) && object.nodeType == 3;
}

module.exports = isTextNode;