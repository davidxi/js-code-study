/**
 * @providesModule containsNode
 */
var isTextNode = require('./isTextNode.js');

/**
 * Checks if a given DOM node contains or is another DOM node.
 *
 * @param {?DOMNode} outerNode Outer DOM node.
 * @param {?DOMNode} innerNode Inner DOM node.
 * @return {boolean} True if `outerNode` contains or is `innerNode`.
 */
function containsNode(outerNode, innerNode) {
    if (!outerNode || !innerNode) {
        return false;
    } else if (outerNode === innerNode) {
        return true;
    } else if (isTextNode(outerNode)) {
        return false;
    } else if (isTextNode(innerNode)) {
        return containsNode(outerNode, innerNode.parentNode);
    } else if (outerNode.contains) {
        // The Node.contains() method returns a Boolean value indicating
        // whether a node is a descendant of a given node. or not.
        return outerNode.contains(innerNode);
    } else if (outerNode.compareDocumentPosition) {
        // The Node.compareDocumentPosition() method compares the position
        // of the current node against another node in any other document.

        // var head = document.getElementsByTagName('head').item(0);
        // if (head.compareDocumentPosition(document.body) & Node.DOCUMENT_POSITION_FOLLOWING) {
        //     console.log("well-formed document");
        // } else {
        //     console.log("<head> is not before <body>");
        // }
        return !!(outerNode.compareDocumentPosition(innerNode) & 16);
    } else {
        return false;
    }
}

module.exports = containsNode;