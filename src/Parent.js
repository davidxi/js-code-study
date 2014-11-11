/**
 *  @providesModule Parent
 */
var CSSCore = require('./CSSCore.js');

var Parent = {
    byTag: function(node, tagName) {
        tagName = tagName.toUpperCase();
        while (node && node.nodeName !== tagName)
            node = node.parentNode;
        return node;
    },
    byClass: function(node, className) {
        while (node && !CSSCore.hasClass(node, className))
            node = node.parentNode;
        return node;
    },
    byAttribute: function(node, attr) {
        while (node && (!node.getAttribute || !node.getAttribute(attr)))
            node = node.parentNode;
        return node;
    }
};

module.exports = Parent;