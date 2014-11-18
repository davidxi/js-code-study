/**
 * @providesModule Primer
 */
var Bootloader = require('./Bootloader.js');
var CSS = require('./CSS.js');
var ErrorUtils = require('./ErrorUtils.js');
var Parent = require('./Parent.js');
var clickRefAction = require('./clickRefAction.js');
var trackReferrer = require('./trackReferrer.js');
var userAction = require('./userAction.js');

var elementOnClicked = null;
var regexActionType = /async(?:-post)?|dialog(?:-post)?|theater|toggle/;
/**
 * document.documentElement is the root element of the document.
 * for example, the <html> element for HTML documents.
 */
var rootElement = document.documentElement;

/**
 * define:
 *     <node data-hover='{module1: method1, modul2: method2}'>
 * call:
 *     loadModuleUponAction({event target node}, 'data-hover');
 */
function loadModuleUponAction(eventTarget, actionAttr) {
    eventTarget = Parent.byAttribute(eventTarget, actionAttr);
    if (!eventTarget) {
        return;
    }
    do {
        var actionMap = eventTarget.getAttribute(actionAttr);
        JSON.parse(actionMap).forEach(function(actionOnModule) {
            var _eventTarget = eventTarget;
            Bootloader.loadModules.call(Bootloader, [actionOnModule[0]], function(module) {
                module[actionOnModule[1]](_eventTarget);
            });
        });
    } while (eventTarget = Parent.byAttribute(eventTarget.parentNode, actionAttr));
    return false;
}

// -------------------------------------
//  listen `click`
// -------------------------------------
rootElement.onclick = ErrorUtils.guard(function(event) {
    event = event || window.event;
    elementOnClicked = event.target || event.srcElement;

    var linkNodeOnClicked = Parent.byTag(elementOnClicked, 'A');
    if (!linkNodeOnClicked) {
        return loadModuleUponAction(elementOnClicked, 'data-onclick');
    }

    var ajaxHref = linkNodeOnClicked.getAttribute('ajaxify');
    var realHref = linkNodeOnClicked.href;
    var href = ajaxHref || realHref;
    if (href) {
        clickRefAction('a', linkNodeOnClicked, event).coalesce_namespace('primer');
        userAction('primer', linkNodeOnClicked, event, {
            mode: 'DEDUP'
        }).uai_fallback('click');
    }

    if (ajaxHref && realHref && !(/#$/).test(realHref)) {
        var z = event.which && event.which === 2;
        var aa = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
        if (z || aa) {
            return;
        }
    }

    var loadModulesHandler = loadModuleUponAction(elementOnClicked, 'data-onclick');
    trackReferrer(linkNodeOnClicked, href);

    var actionType = linkNodeOnClicked.rel && linkNodeOnClicked.rel.match(regexActionType);
    actionType = actionType && actionType[0];
    switch (actionType) {
        case 'dialog':
        case 'dialog-post':
            Bootloader.loadModules(["AsyncDialog"], function(module) {
                module.bootstrap(href, linkNodeOnClicked, actionType);
            });
            break;
        case 'async':
        case 'async-post':
            Bootloader.loadModules(["AsyncRequest"], function(module) {
                module.bootstrap(href, linkNodeOnClicked);
            });
            break;
        case 'theater':
            Bootloader.loadModules(["PhotoSnowlift"], function(module) {
                module.bootstrap(href, linkNodeOnClicked);
            });
            break;
        case 'toggle':
            CSS.toggleClass(linkNodeOnClicked.parentNode, 'openToggler');
            Bootloader.loadModules(["Toggler"], function(module) {
                module.bootstrap(linkNodeOnClicked);
            });
            break;
        default:
            // `loadModulesHandler` always returns false
            return loadModulesHandler;
    }
    return false;
}, 'Primer click');

// -------------------------------------
//  listen `submit`
// -------------------------------------
rootElement.onsubmit = ErrorUtils.guard(function(event) {
    event = event || window.event;
    var eventTarget = event.target || event.srcElement;

    if (eventTarget &&
        eventTarget.nodeName == 'FORM' &&
        eventTarget.getAttribute('rel') == 'async') {

        clickRefAction('f', eventTarget, event).coalesce_namespace('primer');
        userAction('primer', eventTarget, event, {
            mode: 'DEDUP'
        }).uai_fallback('submit');

        var formSubmitClickedElement = elementOnClicked;
        Bootloader.loadModules(["Form"], function(module) {
            module.bootstrap(eventTarget, formSubmitClickedElement);
        });
        return false;
    }
}, 'Primer submit');

// -------------------------------------
//  general wrap function to bind event
// -------------------------------------    
var bindNativeEvent = function(eventType, event) {
    event = event || window.event;
    var eventTarget = event.target || event.srcElement;

    loadModuleUponAction(eventTarget, 'data-on' + eventType);

    var hoverActionElement = Parent.byAttribute(eventTarget, 'data-hover');
    if (!hoverActionElement) {
        return;
    }
    switch (hoverActionElement.getAttribute('data-hover')) {
        case 'tooltip':
            Bootloader.loadModules(["Tooltip"], function(module) {
                module.process(hoverActionElement, eventTarget);
            });
            break;
    }
};

// -------------------------------------
//  listen `mouseover`
// -------------------------------------
rootElement.onmouseover = ErrorUtils.guard(bindNativeEvent.bind(null, 'mouseover'), 'Primer mouseover');

// -------------------------------------
//  listen `focus`
// -------------------------------------
var onFocusHandler = ErrorUtils.guard(bindNativeEvent.bind(null, 'focus'), 'Primer focus');
if (rootElement.addEventListener) {
    rootElement.addEventListener('focus', onFocusHandler, true);
} else {
    rootElement.attachEvent('onfocusin', onFocusHandler);
}