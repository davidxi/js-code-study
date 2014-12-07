/**
 * @providesModule getElementText
 */
var isElementNode = require('isElementNode');
var isTextNode = require('isTextNode');

var cachedDOMTextProp = null;

function getElementText(elem) {
    if (isTextNode(elem)) {
        return elem.data;
    } else if (isElementNode(elem)) {
        if (cachedDOMTextProp === null) {
            var tempNode = document.createElement('div');
            cachedDOMTextProp = tempNode.textContent != null ?
                'textContent' :
                'innerText';
        }
        return elem[cachedDOMTextProp];
    } else {
        return '';
    }
}
module.exports = getElementText;