/**
 *  @providesModule CSS
 */
var CSSCore = require('./CSSCore.js');
var $ = require('./$.js').unsafe;

// .hidden_elem {display: none !important;}
var hiddenClassName = 'hidden_elem';

var CSS = {
    setClass: function(nodeId, className) {
        $(nodeId).className = className || '';
        return nodeId;
    },
    hasClass: function(nodeId, className) {
        return CSSCore.hasClass($(nodeId), className);
    },
    addClass: function(nodeId, className) {
        return CSSCore.addClass($(nodeId), className);
    },
    removeClass: function(nodeId, className) {
        return CSSCore.removeClass($(nodeId), className);
    },
    conditionClass: function(nodeId, className, bool) {
        return CSSCore.conditionClass($(nodeId), className, bool);
    },
    toggleClass: function(nodeId, className) {
        return CSS.conditionClass(nodeId, className, !CSS.hasClass(nodeId, className));
    },
    shown: function(nodeId) {
        return !CSS.hasClass(nodeId, hiddenClassName);
    },
    hide: function(nodeId) {
        return CSS.addClass(nodeId, hiddenClassName);
    },
    show: function(nodeId) {
        return CSS.removeClass(nodeId, hiddenClassName);
    },
    toggle: function(nodeId) {
        return CSS.toggleClass(nodeId, hiddenClassName);
    },
    conditionShow: function(nodeId, bool) {
        return CSS.conditionClass(nodeId, hiddenClassName, !bool);
    }
};

module.exports = CSS;