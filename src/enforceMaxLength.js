/**
 * @providesModule enforceMaxLength
 */
var DOM = require('DOM');
var Event = require('Event');
var Input = require('Input');
var InputSelection = require('InputSelection');

function enforceMaxLength(inputElem, maxLength) {
    var value = Input.getValue(inputElem);
    var length = value.length;
    var trailingLen = length - maxLength;
    if (trailingLen > 0) {
        var range, selectionEnd;
        try {
            range = InputSelection.get(inputElem);
            selectionEnd = range.end;
        } catch (err) {
            range = null;
            selectionEnd = 0;
        }
        if (selectionEnd >= trailingLen) {
            length = selectionEnd;
        }
        var maxEnd = length - trailingLen;
        if (maxEnd && (value.charCodeAt(maxEnd - 1) & 64512) === 55296) { // @todo: what purpose ?
            maxEnd--;
        }
        selectionEnd = Math.min(selectionEnd, maxEnd);
        Input.setValue(inputElem, value.slice(0, maxEnd) + value.slice(length));
        if (range) {
            InputSelection.set(inputElem, Math.min(range.start, selectionEnd), selectionEnd);
        }
    }
}

var inputListener = function(event) {
    var target = event.getTarget();
    var maxLength = target.getAttribute && parseInt(target.getAttribute('maxlength'), 10);
    if (maxLength > 0 && DOM.isNodeOfType(target, ['input', 'textarea'])) {
        setTimeout(enforceMaxLength.bind(null, target, maxLength), 0);
    }
};

var browserNoMaxLenghSupport = (
    'maxLength' in DOM.create('input') &&
    'maxLength' in DOM.create('textarea')
);
if (!browserNoMaxLenghSupport) {
    Event.listen(document.documentElement, {
        keydown: inputListener,
        paste: inputListener
    });
}

module.exports = enforceMaxLength;