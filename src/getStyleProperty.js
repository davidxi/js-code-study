/**
 * @providesModule getStyleProperty
 */
var camelize = require('camelize');
var hyphenate = require('hyphenate');

function toString(str) {
    return str == null ? str : String(str);
}

function getStyleProperty(elem, prop) {
    var computedStyle;

    // IE >= 9 supported
    if (window.getComputedStyle) {
        computedStyle = window.getComputedStyle(elem, null);
        if (computedStyle) {
            return toString(computedStyle.getPropertyValue(hyphenate(prop)));
        }
    }

    // In many code samples online, getComputedStyle is used from the document.defaultView object.
    // In nearly all cases, this is needless, as getComputedStyle exists on the window object as well.
    // However, there is a single case where the defaultView's method mustbe used: when using Firefox 3.6 to access framed styles.
    if (document.defaultView && document.defaultView.getComputedStyle) {
        computedStyle = document.defaultView.getComputedStyle(elem, null);
        if (computedStyle) {
            return toString(computedStyle.getPropertyValue(hyphenate(prop)));
        }
        if (prop === 'display') {
            return 'none';
        }
    }

    // retrieve from currentStyle
    if (elem.currentStyle) {
        if (prop === 'float') {
            return toString(elem.currentStyle.cssFloat || elem.currentStyle.styleFloat);
        }
        return toString(elem.currentStyle[camelize(prop)]);
    }

    // retrieve from inline style
    return toString(elem.style && elem.style[camelize(prop)]);
}
module.exports = getStyleProperty;