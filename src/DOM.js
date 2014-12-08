/**
 * @providesModule DOM
 */
var DOMQuery = require('DOMQuery');
var Event = require('Event');
var HTML = require('HTML');
var TokenReplacement = require('TokenReplacement');
var UserAgent_DEPRECATED = require('UserAgent_DEPRECATED');
var $ = require('$');
var copyProperties = require('copyProperties');
var createArrayFromMixed = require('createArrayFromMixed');
var getOrCreateDOMID = require('getOrCreateDOMID');
var getObjectValues = require('getObjectValues');
var isScalar = require('isScalar');

var DOM = {
    create: function(tagName, attrs, elemContent) {
        var elemContainer = document.createElement(tagName);
        if (attrs) {
            DOM.setAttributes(elemContainer, attrs);
        }
        if (elemContent != null) {
            DOM.setContent(elemContainer, elemContent);
        }
        return elemContainer;
    },
    setAttributes: function(elem, attrs) {
        if (attrs.type) {
            elem.type = attrs.type;
        }
        for (var attr in attrs) {
            var value = attrs[attr];
            if (attr == 'type') {
                continue;
            } else if (attr == 'style') {
                if (typeof value == 'string') {
                    elem.style.cssText = value;
                } else {
                    copyProperties(elem.style, value);
                }
            } else if ((/^on/i).test(attr)) {
                // has inline event listener
                Event.listen(elem, attr.substr(2), value);
            } else if (attr in elem) {
                elem[attr] = value;
            } else if (elem.setAttribute) {
                elem.setAttribute(attr, value);
            }
        }
    },
    prependContent: function(elemContainer, elemContent) {
        return onUpdate(elemContent, elemContainer, function(fragment) {
            elemContainer.firstChild ?
                elemContainer.insertBefore(fragment, elemContainer.firstChild) :
                elemContainer.appendChild(fragment);
        });
    },
    insertAfter: function(elemOffset, elemContent) {
        var elemContainer = elemOffset.parentNode;
        return onUpdate(elemContent, elemContainer, function(fragment) {
            // there is no Node.insertAfter() method
            elemOffset.nextSibling ?
                elemContainer.insertBefore(fragment, elemOffset.nextSibling) :
                elemContainer.appendChild(fragment);
        });
    },
    insertBefore: function(elemOffset, elemContent) {
        var elemContainer = elemOffset.parentNode;
        return onUpdate(v, elemContainer, function(fragment) {
            elemContainer.insertBefore(fragment, elemContent);
        });
    },
    setContent: function(elemContainer, elemContent) {
        // @todo: why not just call DOM.empty() ?
        while (elemContainer.firstChild) {
            removeNode(elemContainer.firstChild);
        }
        return DOM.appendContent(elemContainer, elemContent);
    },
    appendContent: function(elemContainer, elemContent) {
        return onUpdate(elemContent, elemContainer, function(fragment) {
            elemContainer.appendChild(fragment);
        });
    },
    replace: function(elemToReplace, elemContent) {
        var elemContainer = elemToReplace.parentNode;
        return onUpdate(elemContent, elemContainer, function(fragment) {
            elemContainer.replaceChild(fragment, elemToReplace);
        });
    },
    remove: function(elem) {
        removeNode($(elem));
    },
    empty: function(elem) {
        elem = $(elem);
        while (elem.firstChild) {
            removeNode(elem.firstChild);
        }
    },
    getID: getOrCreateDOMID
};
copyProperties(DOM, DOMQuery);

function removeNode(elem) {
    if (elem.parentNode) {
        elem.parentNode.removeChild(elem);
    }
}

function onUpdate(elemContent, elemContainer, onUpdate) {
    elemContent = HTML.replaceJSONWrapper(elemContent);

    if (elemContent instanceof HTML &&
        '' === elemContainer.innerHTML &&
        -1 === elemContent.toString().indexOf('<scr' + 'ipt')) {

        var ieVersion = UserAgent_DEPRECATED.ie();
        if (!ieVersion ||
            (ieVersion > 7 && !DOMQuery.isNodeOfType(elemContainer, ['table', 'tbody', 'thead', 'tfoot', 'tr', 'select', 'fieldset']))) {

            if (ieVersion) {
                // @todo: why add an invisible element for IE >= 8
                elemContainer.innerHTML = '<em style="display:none;">&nbsp;</em>' + elemContent.toString();
                elemContainer.removeChild(elemContainer.firstChild);
            } else {
                // HTML toString() returns markup
                elemContainer.innerHTML = elemContent.toString();
            }
            return createArrayFromMixed(elemContainer.childNodes);
        }
    } else if (DOMQuery.isTextNode(elemContainer)) {
        elemContainer.data = elemContent;
        return [elemContent];
    }

    var fragment = document.createDocumentFragment();
    var pendingNodes = [];
    var inlineActions = [];

    elemContent = TokenReplacement.isInstance(elemContent) ?
        getObjectValues(elemContent) :
        createArrayFromMixed(elemContent);

    for (var da = 0; da < elemContent.length; da++) {
        var aa = HTML.replaceJSONWrapper(elemContent[da]);

        if (aa instanceof HTML) {
            inlineActions.push(aa.getAction());
            var nodes = aa.getNodes();
            for (var fa = 0; fa < nodes.length; fa++) {
                pendingNodes.push(nodes[fa]);
                fragment.appendChild(nodes[fa]);
            }

        } else if (isScalar(aa)) {
            var textNode = document.createTextNode(aa);
            pendingNodes.push(textNode);
            fragment.appendChild(textNode);

        } else if (DOMQuery.isNode(aa)) {
            pendingNodes.push(aa);
            fragment.appendChild(aa);
        }
    }

    onUpdate(fragment);

    inlineActions.forEach(function(inlineAction) {
        inlineAction();
    });
    return pendingNodes;
}
module.exports = DOM;