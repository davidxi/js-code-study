/**
 * @providesModule PageletSet
 */
var Arbiter = require('Arbiter');

var pagelets = {};
var PageletSet = {
    hasPagelet: function(pageletId) {
        return pagelets.hasOwnProperty(pageletId);
    },
    getPagelet: function(pageletId) {
        return pagelets[pageletId];
    },
    getOrCreatePagelet: function(pageletId) {
        if (!PageletSet.hasPagelet(pageletId)) {
            var pagelet = new Pagelet(pageletId);
            pagelets[pageletId] = pagelet;
        }
        return PageletSet.getPagelet(pageletId);
    },
    getPageletIDs: function() {
        return Object.keys(pagelets);
    },
    removePagelet: function(pageletId) {
        if (PageletSet.hasPagelet(pageletId)) {
            pagelets[pageletId].destroy();
            delete pagelets[pageletId];
        }
    }
};

function isParent(parentNode, childNode) { // @todo: this can be replaced by require('containsNode')
    return parentNode.contains ?
        parentNode.contains(childNode) :
        parentNode.compareDocumentPosition(childNode) & 16;
}

function Pagelet(pageletId) {
    this.id = pageletId;
    this._root = null;
    this._destructors = [];
    this.addDestructor(function destructor() {
        Arbiter.inform('pagelet/destroy', {
            id: this.id,
            root: this._root
        });
    }.bind(this));
}
Pagelet.prototype.setRoot = function(rootElement /*element node*/ ) {
    this._root = rootElement;
};
Pagelet.prototype._getDescendantPagelets = function() {
    var children = [];
    if (!this._root) {
        return children;
    }
    var allPageletsIds = PageletSet.getPageletIDs();
    for (var n = 0; n < allPageletsIds.length; n++) {
        var pageletId = allPageletsIds[n];
        if (pageletId === this.id) {
            continue;
        }
        var pagelet = pagelets[pageletId];
        if (pagelet._root && isParent(this._root, pagelet._root)) {
            children.push(pagelet);
        }
    }
    return children;
};
Pagelet.prototype.addDestructor = function(destructorFn) {
    this._destructors.push(destructorFn);
};
Pagelet.prototype.destroy = function() {
    // destroy children
    var childrenPagelets = this._getDescendantPagelets();
    for (var m = 0; m < childrenPagelets.length; m++) {
        var childPagelet = childrenPagelets[m];
        if (PageletSet.hasPagelet(childPagelet.id)) { // @todo: this if is redundant, since removePagelet() has it inside too
            PageletSet.removePagelet(childPagelet.id);
        }
    }
    // destroy self
    for (m = 0; m < this._destructors.length; m++) {
        this._destructors[m]();
    }
    if (this._root) {
        while (this._root.firstChild) {
            this._root.removeChild(this._root.firstChild);
        }
    }
};
module.exports = PageletSet;