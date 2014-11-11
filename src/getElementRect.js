/**
 * @providesModule getElementRect
 */
var containsNode = require('./containsNode.js');

function getElementRect(node) {
    // Returns the Element that is the root element of the document (for example, the <html> element for HTML documents).
    var docRoot = document.documentElement;
    if (!('getBoundingClientRect' in node) || !containsNode(docRoot, node)) return {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
    };
    // The Element.getBoundingClientRect() method returns a text rectangle object that encloses a group of text rectangles.
    // The returned value is a TextRectangle object which is the union of the rectangles returned by getClientRects() for the element,
    // i.e., the CSS border-boxes associated with the element.

    // The returned value is a TextRectangle object, which contains read-only left, top, right and bottom properties
    // describing the border-box in pixels. top and left are relative to the top-left of the viewport.
    var boundRect = node.getBoundingClientRect();

    return {
        left: Math.round(boundRect.left) - docRoot.clientLeft,
        right: Math.round(boundRect.right) - docRoot.clientLeft,
        top: Math.round(boundRect.top) - docRoot.clientTop,
        bottom: Math.round(boundRect.bottom) - docRoot.clientTop
    };
}

module.exports = getElementRect;
