/**
 * @providesModule isElementNode
 */
var isNode = require('isNode');

function isElementNode(elem) {
    return isNode(elem) && elem.nodeType == 1;
}
module.exports = isElementNode;