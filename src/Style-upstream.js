/**
 * @providesModule Style-upstream
 */
var camelize = require('camelize');
var containsNode = require('containsNode');
var ex = require('ex');
var getOpacityStyleName = require('getOpacityStyleName');
var getStyleProperty = require('getStyleProperty');
var hyphenate = require('hyphenate');
var invariant = require('invariant');

function isScrollCSS(elem, prop /*'overflow'||'overflowX'||'overflowY'*/ ) {
    var w = StyleUpstream.get(elem, prop);
    return (w === 'auto' || w === 'scroll');
}
var o = new RegExp(('\\s*' + '([^\\s:]+)' + '\\s*:\\s*' + '([^;(\'"]*(?:(?:\\([^)]*\\)|"[^"]*"|\'[^\']*\')[^;(?:\'"]*)*)' + '(?:;|$)'), 'g');

function extractCSSText(cssText) {
    var cssObj = {};
    cssText.replace(o, function(w, keyMatched, valMatched) {
        cssObj[keyMatched] = valMatched;
    });
    return cssObj;
}

function cssObjToText(cssObj) {
    var cssText = '';
    for (var cssProp in cssObj) {
        if (cssObj[cssProp]) {
            cssText += cssProp + ':' + cssObj[cssProp] + ';';
        }
    }
    return cssText;
}

function normalizeFilterValue(u) {
    return u !== '' ? 'alpha(opacity=' + u * 100 + ')' : '';
}

function validatePropValue(u, prop, value) {
    switch (hyphenate(prop)) {
        case 'font-weight':
        case 'line-height':
        case 'opacity':
        case 'z-index':
            break;
        case 'width':
        case 'height':
            var isNegativeNum = parseInt(value, 10) < 0;
            invariant(!isNegativeNum);
            /* falls through */
        default:
            invariant(isNaN(value) || !value || value === '0');
            break;
    }
}
var StyleUpstream = {
    set: function(elem, prop, newValue) {
        validatePropValue('Style.set', prop, newValue);
        var runtimeStyleObj = elem.style;
        switch (prop) {
            case 'opacity':
                if (getOpacityStyleName() === 'filter') {
                    runtimeStyleObj.filter = normalizeFilterValue(newValue);
                } else {
                    runtimeStyleObj.opacity = newValue;
                }
                break;
            case 'float':
                runtimeStyleObj.cssFloat = runtimeStyleObj.styleFloat = newValue || '';
                break;
            default:
                try {
                    runtimeStyleObj[camelize(prop)] = newValue;
                } catch (y) {
                    throw new Error(ex('Style.set: "%s" argument is invalid: %s', prop, newValue));
                }
        }
    },
    apply: function(elem, cssApplyObj) {
        var cssProp;
        for (cssProp in cssApplyObj) {
            validatePropValue('Style.apply', cssProp, cssApplyObj[cssProp]);
        }
        if ('opacity' in cssApplyObj && getOpacityStyleName() === 'filter') {
            cssApplyObj.filter = normalizeFilterValue(cssApplyObj.opacity);
            delete cssApplyObj.opacity;
        }

        var cssObj = extractCSSText(elem.style.cssText); // returned obj

        for (cssProp in cssApplyObj) {
            var cssVal = cssApplyObj[cssProp];
            delete cssApplyObj[cssProp];

            var normalizedCssProp = hyphenate(cssProp);
            for (var aa in cssObj) {
                if (aa === normalizedCssProp ||
                    aa.indexOf(normalizedCssProp + '-') === 0) {
                    delete cssObj[aa];
                }
            }
            cssApplyObj[normalizedCssProp] = cssVal;
        }
        Object.assign(cssObj, cssApplyObj); // @todo why not use merge?

        elem.style.cssText = cssObjToText(cssObj);
    },
    get: getStyleProperty,
    getFloat: function(elem, prop) {
        return parseFloat(StyleUpstream.get(elem, prop), 10);
    },
    getOpacity: function(elem) {
        if (getOpacityStyleName() === 'filter') {
            var filterValue = StyleUpstream.get(elem, 'filter');
            if (filterValue) { // for ie
                var w = /(\d+(?:\.\d+)?)/.exec(filterValue);
                if (w) {
                    return parseFloat(w.pop()) / 100;
                }
            }
        }
        return StyleUpstream.getFloat(elem, 'opacity') || 1;
    },
    isFixed: function(elem) {
        while (containsNode(document.body, elem)) { // @todo: why not use `elem && elem !== document.body`
            if (StyleUpstream.get(elem, 'position') === 'fixed') {
                return true;
            }
            elem = elem.parentNode;
        }
        return false;
    },
    getScrollParent: function(elem) {
        if (!elem) {
            return null;
        }
        while (elem && elem !== document.body) {
            if (isScrollCSS(elem, 'overflow') ||
                isScrollCSS(elem, 'overflowY') ||
                isScrollCSS(elem, 'overflowX')) {
                return elem;
            }
            elem = elem.parentNode;
        }
        return window;
    }
};
module.exports = StyleUpstream;