/**
 * @providesModule DOMQuery
 */
var CSS = require('CSS');
var containsNode = require('containsNode');
var createArrayFromMixed = require('createArrayFromMixed');
var createObjectFrom = require('createObjectFrom');
var ge = require('ge');
var getDocumentScrollElement = require('getDocumentScrollElement');
var isElementNode = require('isElementNode');
var isNode = require('isNode');
var isTextNode = require('isTextNode');

function hasAttribute(element, attrName) {
    return element.hasAttribute ?
            element.hasAttribute(attrName) :
            element.getAttribute(attrName) !== null;
}
var DOMQuery = {
    find: function(rootElement, selector) /*one element*/ {
        var matched = DOMQuery.scry(rootElement, selector);
        return matched[0];
    },
    findPushSafe: function(rootElement, selector1, selector2) /*one element*/ {
        var resultBySelector1 = DOMQuery.scry(rootElement, selector1);
        var resultBySelector2 = DOMQuery.scry(rootElement, selector2);
        var result;

        if (resultBySelector1.length === 1 &&
            resultBySelector2.length === 1 &&
            resultBySelector1[0] === resultBySelector2[0]) {
            result = resultBySelector1;
        } else {
            result = resultBySelector1.concat(resultBySelector2);
        }
        return result[0];
    },
    scry: function(rootElement, selector) /*array of elements*/ {
        if (!rootElement || !rootElement.getElementsByTagName) {
            return [];
        }
        var selectorNS = selector.split(' '), // selector hierachy
            candidateElements = [rootElement];
        for (var v = 0; v < selectorNS.length; v++) {
            if (candidateElements.length === 0) break;
            if (selectorNS[v] === '') continue;

            var selectorCurrentLevel = selectorNS[v],
                selectorCurrentLevel_ = selectorNS[v], // backup, since we will modify `selectorCurrentLevel` variable
                matchedElements = [],
                matchParentMode = false; // like .closest() in jQuery

            // leading ^ operator
            if (selectorCurrentLevel.charAt(0) == '^') {
                if (v === 0) {
                    matchParentMode = true;
                    selectorCurrentLevel = selectorCurrentLevel.slice(1);
                } else {
                    return [];
                }
            }

            selectorCurrentLevel = selectorCurrentLevel.replace(/\[(?:[^=\]]*=(?:"[^"]*"|'[^']*'))?|[.#]/g, ' $&');
            var currentSelectorKeyValues = selectorCurrentLevel.split(' ');

            var tagName = currentSelectorKeyValues[0] || '*';
            var noTagNameSpecific = tagName == '*';

            var isById = currentSelectorKeyValues[1] &&
                currentSelectorKeyValues[1].charAt(0) == '#';

            if (isById) {
                /**
                 * find by Id
                 */
                var matched = ge(currentSelectorKeyValues[1].slice(1), rootElement, tagName);
                if (matched && (noTagNameSpecific || matched.tagName.toLowerCase() == tagName)) {

                    for (var fa = 0; fa < candidateElements.length; fa++) {
                        if (matchParentMode && DOMQuery.contains(matched, candidateElements[fa])) {
                            matchedElements = [matched];
                            break;
                        } else if (document == candidateElements[fa] || DOMQuery.contains(candidateElements[fa], matched)) {
                            // 'byId' returns only one matched
                            matchedElements = [matched];
                            break;
                        }
                    }
                }
            } else {
                /**
                 * find by ClassName and/or Attributes
                 */
                var tempCandidates = [];
                var notByAttr = !matchParentMode &&
                    selectorCurrentLevel_.indexOf('[') < 0 &&
                    document.querySelectorAll;
                // Element.querySelectorAll()
                // Chrome  Firefox (Gecko) Internet Explorer  Safari
                // 1       3.5             8                  3.2

                for (var ka = 0, ha = candidateElements.length; ka < ha; ka++) {

                    var tempMatched;
                    if (matchParentMode) {
                        tempMatched = [];
                        var parentNode = candidateElements[ka].parentNode;
                        while (isElementNode(parentNode)) {
                            if (noTagNameSpecific || parentNode.tagName.toLowerCase() == tagName) {
                                tempMatched.push(parentNode);
                            }
                            parentNode = parentNode.parentNode;
                        }
                    } else if (notByAttr) {
                        tempMatched = candidateElements[ka].querySelectorAll(selectorCurrentLevel_);
                    } else {
                        tempMatched = candidateElements[ka].getElementsByTagName(tagName);
                    }
                    for (var na = 0, ma = tempMatched.length; na < ma; na++) {
                        tempCandidates.push(tempMatched[na]);
                    }
                }
                if (!notByAttr) {
                    // currentSelectorKeyValues[0] --> tagName
                    for (var oa = 1; oa < currentSelectorKeyValues.length; oa++) {

                        var attrKeyValues = currentSelectorKeyValues[oa];
                        var isClassNameMatch = attrKeyValues.charAt(0) == '.';

                        for (ka = 0; ka < tempCandidates.length; ka++) {
                            var candidateElem = tempCandidates[ka];

                            if (!candidateElem || candidateElem.nodeType !== 1) continue; // @todo: why not use 'isElementNode' ?

                            if (isClassNameMatch) {
                                var classNameToMatch = attrKeyValues.substring(1);
                                if (!CSS.hasClass(candidateElem, classNameToMatch)) {
                                    delete tempCandidates[ka];
                                }
                                continue;
                            } else {
                                // slice '[' and ']'
                                var attr = attrKeyValues.slice(1, attrKeyValues.length - 1);

                                if (attr.indexOf('=') == -1) {
                                    // [attr] --> has 'attr'
                                    if (!hasAttribute(candidateElem, attr)) {
                                        delete tempCandidates[ka];
                                        continue;
                                    }
                                } else {
                                    // [attr=value]
                                    var ua = attr.split('='),
                                        attrName = ua[0],
                                        attrValue = ua[1];
                                    // slice quote character around value string
                                    attrValue = attrValue.slice(1, attrValue.length - 1);
                                    if (candidateElem.getAttribute(attrName) != attrValue) {
                                        delete tempCandidates[ka];
                                        continue;
                                    }
                                }
                            }
                        }
                    }
                }
                for (ka = 0; ka < tempCandidates.length; ka++) {
                    if (tempCandidates[ka]) {
                        matchedElements.push(tempCandidates[ka]);
                        // for ^ operator (match parent mode),
                        // only returns closest matched parent node.
                        if (matchParentMode) break;
                    }
                }
            }
            candidateElements = matchedElements;
        }
        return candidateElements;
    },
    getSelection: function() {
        // a selection object representing the range of text selected by the user
        if (window.getSelection) {
            // Chrome  Firefox (Gecko) Internet Explorer   Opera   Safari
            // Yes     Yes             From version 9      (Yes)   (Yes)
            return window.getSelection() + '';
        } else if (document.selection) {
            // DOM level 2
            return document.selection.createRange().text;
        }
        return null;
    },
    contains: function(outerNode, innerNode) {
        outerNode = ge(outerNode);
        innerNode = ge(innerNode);
        return containsNode(outerNode, innerNode);
    },
    getRootElement: function() {
        var rootElement = null;
        if (window.Quickling && Quickling.isActive()) {
            rootElement = ge('content');
        }
        return rootElement || document.body;
    },
    isNode: function(element) { // @todo: why not just assign to `isNode`
        return isNode(element);
    },
    isNodeOfType: function(element, detectTypes /*array*/ ) {
        var detectTypes_ = createArrayFromMixed(detectTypes).join('|').toUpperCase().split('|');
        var needle = createObjectFrom(detectTypes_);
        return isNode(element) &&
                element.nodeName in needle;
        // Node.nodeName read-only property returns the name of the current node
        // for Element type, Node.nodeName = Element.tagName
    },
    isElementNode: function(r) { // @todo: why not just assign to `isElementNode`
        return isElementNode(r);
    },
    isTextNode: function(r) { // @todo: why not just assign to `isTextNode`
        return isTextNode(r);
    },
    isInputNode: function(element) {
        return DOMQuery.isNodeOfType(element, ['input', 'textarea']) ||
                element.contentEditable === 'true';
        // HTMLElement.contentEditable
        // Chrome  Firefox (Gecko) Internet Explorer   Opera   Safari
        // 11      3.0 (1.9)       6                   10.6    3.2
    },
    getDocumentScrollElement: getDocumentScrollElement
};
module.exports = DOMQuery;