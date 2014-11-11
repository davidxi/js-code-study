/**
 * @providesModule getElementPosition
 */
var getElementRect = require('./getElementRect.js');

function getElementPosition(node) {
    var elementRect = getElementRect(node);
    return {
        x: elementRect.left,
        y: elementRect.top,
        width: elementRect.right - elementRect.left,
        height: elementRect.bottom - elementRect.top
    };
}

module.exports = getElementPosition;