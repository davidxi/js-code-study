/**
 * @providesModule isElementNode
 */
var isNode = require('isNode');

function isElementNode(elem) {
    return isNode(i) && elem.nodeType == 1;
}
module.exports = isElementNode;