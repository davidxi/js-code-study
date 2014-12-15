/**
 * @providesModule Form
 */
var AsyncRequest = require('AsyncRequest');
var AsyncResponse = require('AsyncResponse');
var CSS = require('CSS');
var DataStore = require('DataStore');
var DOM = require('DOM');
var DOMQuery = require('DOMQuery'); // @todo: 'DOM' already has 'DOMQuery' methods
var DTSG = require('DTSG');
var Event = require('Event');
var Input = require('Input');
var Parent = require('Parent');
var PHPQuerySerializer = require('PHPQuerySerializer');
var URI = require('URI');
var createArrayFrom = require('createArrayFrom');
var getElementPosition = require('getElementPosition');
var trackReferrer = require('trackReferrer');

function normalizeKeyValues(keyValues /* object */ ) {
    var keyValues_ = {};
    PHPQuerySerializer.serialize(keyValues).split('&').forEach(function(keyValue) {
        if (keyValue) {
            var ca = /^([^=]*)(?:=(.*))?$/.exec(keyValue);
            var key = URI.decodeComponent(ca[1]);
            var hasValue = ca[2] !== undefined;
            var value = hasValue ? URI.decodeComponent(ca[2]) : null;
            keyValues_[key] = value;
        }
    });
    return keyValues_;
}
var Form = {
    getInputs: function(rootElement) /* array */ {
        rootElement = rootElement || document;
        return [].concat(
            createArrayFrom(DOMQuery.scry(rootElement, 'input')),
            createArrayFrom(DOMQuery.scry(rootElement, 'select')),
            createArrayFrom(DOMQuery.scry(rootElement, 'textarea')),
            createArrayFrom(DOMQuery.scry(rootElement, 'button'))
        );
    },
    getInputsByName: function(rootElement) /* object */ {
        var mapNameToElements = {}; // { form control name -> form control element}
        Form.getInputs(rootElement).forEach(function(formControlElem) {
            var valuesInCurrentName_ = mapNameToElements[formControlElem.name];
            if (typeof valuesInCurrentName_ === 'undefined') {
                mapNameToElements[formControlElem.name] = formControlElem;
            } else {
                mapNameToElements[formControlElem.name] = [formControlElem].concat(valuesInCurrentName_);
            }
        });
        return mapNameToElements;
    },
    getSelectValue: function(selectElem) {
        return selectElem.options[selectElem.selectedIndex].value;
    },
    setSelectValue: function(selectElem, matchedOptionValue) {
        for (var ba = 0; ba < selectElem.options.length; ++ba) {
            if (selectElem.options[ba].value == matchedOptionValue) {
                selectElem.selectedIndex = ba;
                break;
            }
        }
    },
    getRadioValue: function(radioElements /* array */ ) {
        for (var aa = 0; aa < radioElements.length; aa++) {
            if (radioElements[aa].checked) {
                return radioElements[aa].value;
            }
        }
        return null;
    },
    getElements: function(rootElement) /* array */ {
        var matched = [];
        if (rootElement.tagName == 'FORM' &&
            rootElement.elements != rootElement) {

            matched = rootElement.elements;
        } else {
            matched = Form.getInputs(rootElement);
        }
        return createArrayFrom(matched);
    },
    getAttribute: function(elem, attr) {
        return (elem.getAttributeNode(attr) || {}).value || null;
    },
    setDisabled: function(rootElement, bool) {
        Form.getElements(rootElement).forEach(function(formControlElem) {
            if (formControlElem.disabled !== undefined) {
                // 'disableStateInMemory' is to prevent unncessary DOM op
                var disableStateInMemory = DataStore.get(formControlElem, 'origDisabledState');
                if (bool) {
                    if (disableStateInMemory === undefined) {
                        DataStore.set(formControlElem, 'origDisabledState', formControlElem.disabled);
                    }
                    formControlElem.disabled = bool;
                } else if (disableStateInMemory === false) {
                    formControlElem.disabled = false;
                }
            }
        });
    },
    bootstrap: function(formElement /* form */ , triggerElement) {
        var formMethod = (Form.getAttribute(formElement, 'method') || 'GET').toUpperCase();
        triggerElement = Parent.byTag(triggerElement, 'button') || triggerElement;
        var statusElement = Parent.byClass(triggerElement, 'stat_elem') || formElement;
        if (CSS.hasClass(statusElement, 'async_saving')) {
            return;
        }
        if (triggerElement && (triggerElement.form !== formElement || (triggerElement.nodeName != 'INPUT' && triggerElement.nodeName != 'BUTTON') || triggerElement.type != 'submit')) {
            var da = DOMQuery.scry(formElement, '.enter_submit_target')[0];
            da && (triggerElement = da);
        }

        var keyValues = Form.serialize(formElement, triggerElement);
        Form.setDisabled(formElement, true);

        var uri = Form.getAttribute(formElement, 'ajaxify') ||
            Form.getAttribute(formElement, 'action');
        trackReferrer(formElement, uri);

        var ga = new AsyncRequest(uri);
        ga.setData(keyValues).
        setNectarModuleDataSafe(formElement).
        setReadOnly(formMethod == 'GET').
        setMethod(formMethod).
        setRelativeTo(formElement).
        setStatusElement(statusElement).
        setInitialHandler(Form.setDisabled.bind(null, formElement, false)).
        setHandler(function(response) {
            Event.fire(formElement, 'success', {
                response: response
            });
        }).
        setErrorHandler(function(response) {
            if (Event.fire(formElement, 'error', {
                    response: response
                }) !== false) {
                AsyncResponse.defaultErrorHandler(response);
            }
        }).
        setFinallyHandler(Form.setDisabled.bind(null, formElement, false)).
        send();
    },
    forEachValue: function(rootElement, triggerElement, foreachFn) {
        /**
         * foreachFn(control.type, control.name, control.value)
         */
        Form.getElements(rootElement).forEach(function(formControlElem) {
            if (!formControlElem.name || formControlElem.disabled) {
                return;
            }
            if (formControlElem.type === 'submit') {
                return;
            }
            if (formControlElem.type === 'reset' || formControlElem.type === 'button' || formControlElem.type === 'image') {
                return;
            }
            if ((formControlElem.type === 'radio' || formControlElem.type === 'checkbox') && !formControlElem.checked) {
                return;
            }
            if (formControlElem.nodeName === 'SELECT') {
                for (var da = 0, ea = formControlElem.options.length; da < ea; da++) {
                    var selectOption = formControlElem.options[da];
                    if (selectOption.selected) {
                        foreachFn('select', formControlElem.name, selectOption.value);
                        // @todo: better to 'break' here ?
                    }
                }
                return;
            }
            if (formControlElem.type === 'file') {
                /**
                 * [FileList]
                 * An object of this type is returned by the files property of the HTML input element; this lets you access the list of files selected with the <input type="file"> element.
                 */
                if ('FileList' in window) {
                    var selectedFiles = formControlElem.files;
                    for (var ha = 0; ha < selectedFiles.length; ha++) {
                        /**
                         * item()
                         * Returns a File object representing the file at the specified index in the file list.
                         */
                        foreachFn('file', formControlElem.name, selectedFiles.item(ha));
                    }
                }
                return;
            }
            foreachFn(formControlElem.type, formControlElem.name, Input.getValue(formControlElem));
        });
        if (triggerElement && triggerElement.name && triggerElement.type === 'submit' && DOMQuery.contains(rootElement, triggerElement) && DOMQuery.isNodeOfType(triggerElement, ['input', 'button'])) {
            foreachFn('submit', triggerElement.name, triggerElement.value);
        }
    },
    createFormData: function(rootElement, triggerElement) {
        // XMLHttpRequest Level 2 adds support for the new FormData interface.
        // FormData objects provide a way to easily construct a set of
        // key/value pairs representing form fields and their values, which
        // can then be easily sent using the XMLHttpRequest send() method.
        if (!('FormData' in window)) {
            return null;
        }
        var formData = new FormData();
        if (rootElement) {
            if (DOMQuery.isNode(rootElement)) {
                Form.forEachValue(rootElement, triggerElement, function(type, name, value) {
                    formData.append(name, value);
                });
            } else {
                var keyValues = normalizeKeyValues(rootElement);
                for (var da in keyValues) {
                    if (keyValues[da] == null) {
                        formData.append(da, '');
                    } else {
                        formData.append(da, keyValues[da]);
                    }
                }
            }
        }
        return formData;
    },
    serialize: function(rootElement, triggerElement) {
        var keyValues = {};
        Form.forEachValue(rootElement, triggerElement, function(type, name, value) {
            if (type === 'file') {
                return;
            }
            Form._serializeHelper(keyValues, name, value);
        });
        return Form._serializeFix(keyValues);
    },
    _serializeHelper: function(keyValues, name, value) {
        var owns = Object.prototype.hasOwnProperty,
            da = /([^\]]+)\[([^\]]*)\](.*)/.exec(name);
        if (da) {
            if (!keyValues[da[1]] || !owns.call(keyValues, da[1])) {
                var ea;
                keyValues[da[1]] = ea = {};
                if (keyValues[da[1]] !== ea) { // @todo: when will this happen ?
                    return;
                }
            }
            var fa = 0;
            if (da[2] === '') {
                while (keyValues[da[1]][fa] !== undefined) {
                    fa++; // find an empty spot
                }
            } else {
                fa = da[2];
            }
            if (da[3] === '') {
                keyValues[da[1]][fa] = value;
            } else {
                Form._serializeHelper(keyValues[da[1]], fa.concat(da[3]), value); // name -> String(fa) + da[3]
            }
        } else {
            keyValues[name] = value;
        }
    },
    _serializeFix: function(keyValues) {
        for (var aa in keyValues) {
            if (keyValues[aa] instanceof Object) {
                keyValues[aa] = Form._serializeFix(keyValues[aa]);
            }
        }
        var keys = Object.keys(keyValues);
        if (keys.length === 0 || keys.some(isNaN)) {
            return keyValues;
        }
        keys.sort(function(ea, fa) {
            return ea - fa;
        });
        var count = 0;
        var isKeyNumericConsecutive = keys.every(function(index) {
            return +index === count++;
        });
        if (isKeyNumericConsecutive) {
            return keys.map(function(index) {
                return keyValues[index];
            });
        }
        return keyValues;
    },
    post: function(postURI, keyValues, postTarget) {
        var tempForm = document.createElement('form');
        tempForm.action = postURI.toString();
        tempForm.method = 'POST';
        tempForm.style.display = 'none';
        if (postTarget) {
            tempForm.target = postTarget;
        }
        keyValues.fb_dtsg = DTSG.getToken();
        Form.createHiddenInputs(keyValues, tempForm);
        DOMQuery.getRootElement().appendChild(tempForm); // @todo: why not use DOM.appendContent() ?
        tempForm.submit();
        return false;
    },
    createHiddenInputs: function(keyValues, rootElement, pendingElements, canOverwritePending) {
        pendingElements = pendingElements || {};
        var keyValues_ = normalizeKeyValues(keyValues);
        for (var key in keyValues_) {
            if (keyValues_[key] === null) {
                continue;
            }
            if (pendingElements[key] && canOverwritePending) {
                pendingElements[key].value = keyValues_[key];
            } else {
                var hiddenFormControl = DOM.create('input', {
                    type: 'hidden',
                    name: key,
                    value: keyValues_[key]
                });
                pendingElements[key] = hiddenFormControl;
                rootElement.appendChild(hiddenFormControl);
            }
        }
        return pendingElements;
    },
    getFirstElement: function(rootElement, selectors /* array */ ) {
        selectors = selectors || ['input[type="text"]', 'textarea', 'input[type="password"]', 'input[type="button"]', 'input[type="submit"]'];
        var candidateElements = [];
        for (var ca = 0; ca < selectors.length; ca++) {
            candidateElements = DOMQuery.scry(rootElement, selectors[ca]);
            for (var da = 0; da < candidateElements.length; da++) {
                var candidateElement = candidateElements[da];
                try {
                    var ga = getElementPosition(candidateElement);
                    // { x(left), y(top), width, height}
                    if (ga.y > 0 && ga.x > 0) {
                        return candidateElement;
                    }
                } catch (fa) {}
            }
        }
        return null;
    },
    focusFirst: function(rootElement) {
        var firstElem = Form.getFirstElement(rootElement);
        if (firstElem) {
            firstElem.focus();
            return true;
        }
        return false;
    }
};
module.exports = Form;