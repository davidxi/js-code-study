/** 
 * @providesModule getActiveElement
 */
/**
 * Same as document.activeElement but wraps in a try-catch block. In IE it is
 * not safe to call document.activeElement if there is nothing focused.
 *
 * The activeElement will be null only if the document body is not yet defined.
 */
function getActiveElement() /*?DOMElement*/ {
    try {
        return document.activeElement || document.body;
    } catch (e) {
        return document.body;
    }
}

module.exports = getActiveElement;