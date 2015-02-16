/**
 * @providesModule HTML
 */
var Bootloader = require('./Bootloader.js');
var createNodesFromMarkup = require('./createNodesFromMarkup.js');
var emptyFunction = require('./emptyFunction.js');
var evalGlobal = require('./evalGlobal.js');
var invariant = require('./invariant.js');

var reSingleTag = /(<(\w+)[^>]*?)\/>/g,
    hasSingleTag = {
        abbr: true,
        area: true,
        br: true,
        col: true,
        embed: true,
        hr: true,
        img: true,
        input: true,
        link: true,
        meta: true,
        param: true
    };

function HTML(o) {
    if (o && typeof o.__html === 'string') o = o.__html;
    if (!(this instanceof HTML)) {
        if (o instanceof HTML) return o;
        return new HTML(o);
    }
    if (o) {
        invariant(typeof o === 'string');
    }
    this._markup = o || '';
    this._defer = false;
    this._extraAction = '';
    this._nodes = null;
    this._inlineJS = emptyFunction;
    this._rootNode = null;
}

HTML.prototype.toString = function() {
    var o = this._markup;
    if (this._extraAction) {
        o += '<script type="text/javascript">' + this._extraAction + '</scr' + 'ipt>';
    }
    return o;
};
HTML.prototype.getContent = function() {
    return this._markup;
};
HTML.prototype.getNodes = function() {
    this._fillCache();
    return this._nodes;
};
HTML.prototype.getRootNode = function() {
    invariant(!this._rootNode);
    var o = this.getNodes();
    if (o.length === 1) {
        this._rootNode = o[0];
    } else {
        var p = document.createDocumentFragment();
        for (var q = 0; q < o.length; q++) p.appendChild(o[q]);
        this._rootNode = p;
    }
    return this._rootNode;
};
HTML.prototype.getAction = function() {
    this._fillCache();
    var actionMethod = function() {
        this._inlineJS();
        evalGlobal(this._extraAction);
    }.bind(this);
    return this._defer ?
            function() { setTimeout(actionMethod, 0); } :
            actionMethod;
};
HTML.prototype._fillCache = function() {
    if (this._nodes !== null) return;
    if (!this._markup) {
        this._nodes = [];
        return;
    }
    var markupBothInClosingTags = this._markup.replace(reSingleTag, function(r, s, t) {
            return hasSingleTag[t.toLowerCase()] ? r : s + '></' + t + '>';
        });
    var scriptBlocks = null;
    var nodesCreated = createNodesFromMarkup(markupBothInClosingTags, function handleScript(scriptNode) {
            scriptBlocks = scriptBlocks || [];
            scriptBlocks.push(
                scriptNode.src ?
                Bootloader.requestJSResource.bind(Bootloader, scriptNode.src) :
                evalGlobal.bind(null, scriptNode.innerHTML)
            );
            scriptNode.parentNode.removeChild(scriptNode);
        });
    if (scriptBlocks) {
        this._inlineJS = function() {
            for (var r = 0; r < scriptBlocks.length; r++) {
                scriptBlocks[r]();
            }
        };
    }
    this._nodes = nodesCreated;
};
HTML.prototype.setAction = function(actionJS) {
    this._extraAction = actionJS;
    return this;
};
HTML.prototype.setDeferred = function(bool) {
    this._defer = !!bool;
    return this;
};
HTML.isHTML = function(o) {
    return !!o && (o instanceof HTML || o.__html !== undefined);
};
HTML.replaceJSONWrapper = function(plainHTML) {
    return plainHTML && plainHTML.__html !== undefined ?
            new HTML(plainHTML.__html) :
            plainHTML;
};

module.exports = HTML;