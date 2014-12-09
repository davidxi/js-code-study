/**
 * @providesModule InputSelection
 */
var DOM = require('DOM');
var Focus = require('Focus');

var InputSelection = {
    get: function(inputElem) {
        /**
         * HTMLInputElement.setSelectionRange()
         */
        if (!document.selection) {
            var rangeObj;
            try {
                rangeObj = {
                    start: inputElem.selectionStart,
                    end: inputElem.selectionEnd
                };
            } catch (err) {
                rangeObj = {
                    start: 0,
                    end: 0
                };
            }
            return rangeObj;
        }

        /**
         * Document.createRange()
         */
        var range = document.selection.createRange();
        // the parent element for the given text range
        if (range.parentElement() !== inputElem) {
            return {
                start: 0,
                end: 0
            };
        }
        var textLength = inputElem.value.length;
        if (DOM.isNodeOfType(inputElem, 'input')) {
            // <INPUT> moveStart, moveEnd 
            return {
                // Change the position of the range
                start: -range.moveStart('character', -textLength),
                end: -range.moveEnd('character', -textLength)
            };
        } else {
            // <TEXTAREA> setEndPoint
            var o = range.duplicate();
            // Move the text range so that the start and end positions of the range encompass the text in the given element
            o.moveToElementText(inputElem);
            o.setEndPoint('StartToEnd', range);
            var endPoint = textLength - o.text.length;
            o.setEndPoint('StartToStart', range);
            return {
                start: textLength - o.text.length,
                end: endPoint
            };
        }
    },
    set: function(inputElem, start, end) {
        if (typeof end == 'undefined') {
            end = start;
        }
        if (document.selection) {
            if (inputElem.tagName == 'TEXTAREA') {
                var m = (inputElem.value.slice(0, start).match(/\r/g) || []).length;
                var n = (inputElem.value.slice(start, end).match(/\r/g) || []).length;
                start -= m;
                end -= m + n;
            }
            var range = inputElem.createTextRange();
            // Collapses (or removes) a range by moving the insertion point to the beginning or end of the current range.
            range.collapse(true);
            // Changes the start position of the range.
            range.moveStart('character', start);
            // Changes the end position of the range.
            range.moveEnd('character', end - start);
            // Makes the selection equal to the current object.
            // When applied to a TextRange object, the select method causes the current object to be highlighted. 
            range.select();
        } else {
            inputElem.selectionStart = start;
            inputElem.selectionEnd = Math.min(end, inputElem.value.length);
            Focus.set(inputElem);
        }
    }
};
module.exports = InputSelection;