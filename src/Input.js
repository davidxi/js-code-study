/**
 * @providesModule Input
 */
var CSS = require('CSS');
var DOMControl = require('DOMControl');
var getActiveElement = require('getActiveElement');

function setMaxLengthBehavior(elem) {
    var maxlengthDefined = elem.getAttribute('maxlength');
    if (maxlengthDefined && maxlengthDefined > 0) {
        // to avoid circular dependency,
        // so require() in run-time.
        global.require(['enforceMaxLength'], function(enforceMaxLength) {
            enforceMaxLength(elem, maxlengthDefined);
        });
    }
}

var Input = {
    hasPlaceholder: function(elem) {
        return CSS.hasClass(elem, 'DOMControl_placeholder');
    },
    isWhiteSpaceOnly: function(value) {
        return !(/\S/).test(value || '');
    },
    isEmpty: function(elem) {
        return Input.isWhiteSpaceOnly(elem.value) ||
            Input.hasPlaceholder(elem);
    },
    getValue: function(elem) {
        return Input.isEmpty(elem) ?
            '' :
            elem.value;
    },
    getValueRaw: function(elem) {
        // ignore white splace in input value
        return Input.hasPlaceholder(elem) ?
            '' :
            elem.value;
    },
    setValue: function(elem, value) {
        CSS.removeClass(elem, 'DOMControl_placeholder');
        elem.value = value || '';
        setMaxLengthBehavior(elem);
        var o = DOMControl.getInstance(elem);
        o && o.resetHeight && o.resetHeight();
    },
    setPlaceholder: function(elem, placeholderValue) {
        elem.setAttribute('aria-label', placeholderValue);
        elem.setAttribute('placeholder', placeholderValue);
        if (elem == getActiveElement()) {
            return;
        }
        if (Input.isEmpty(elem)) {
            CSS.conditionClass(elem, 'DOMControl_placeholder', placeholderValue);
            elem.value = placeholderValue || '';
        }
    },
    reset: function(elem) {
        var defaultValue = elem !== document.activeElement ?
                            (elem.getAttribute('placeholder') || '') :
                            '';
        elem.value = defaultValue;
        CSS.conditionClass(elem, 'DOMControl_placeholder', defaultValue);
        elem.style.height = '';
    },
    setSubmitOnEnter: function(elem, bool) {
        CSS.conditionClass(elem, 'enter_submit', bool);
    },
    getSubmitOnEnter: function(elem) {
        return CSS.hasClass(elem, 'enter_submit');
    },
    setMaxLength: function(elem, maxlength) {
        if (maxlength > 0) {
            elem.setAttribute('maxlength', maxlength);
            setMaxLengthBehavior(elem);
        } else {
            elem.removeAttribute('maxlength');
        }
    }
};
module.exports = Input;