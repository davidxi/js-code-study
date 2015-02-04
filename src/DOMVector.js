/**
 * @providesModule DOMVector
 */
var BasicVector = require('./BasicVector');
var getDocumentScrollElement = require('./getDocumentScrollElement');
var getElementPosition = require('./getElementPosition');
var getUnboundedScrollPosition = require('./getUnboundedScrollPosition');
var getViewportDimensions = require('./getViewportDimensions');

for (var l in BasicVector) {
    if (BasicVector.hasOwnProperty(l)) {
        DOMVector[l] = BasicVector[l];
    }
}
var protoBasicVector = BasicVector === null ?
    null :
    BasicVector.prototype;
DOMVector.prototype = Object.create(protoBasicVector);
DOMVector.prototype.constructor = DOMVector;
DOMVector.__superConstructor__ = BasicVector;


function DOMVector(width, height, domain) {
    BasicVector.call(this, width, height);
    this.domain = domain || 'pure';
}
DOMVector.prototype.derive = function(width, height, domain) {
    return new DOMVector(width, height, domain || this.domain);
};
DOMVector.prototype.add = function(width, height) {
    if (width instanceof DOMVector && width.getDomain() !== 'pure') {
        width = width.convertTo(this.domain);
    }
    return protoBasicVector.add.call(this, width, height);
};
DOMVector.prototype.convertTo = function(domain) {
    if (domain != 'pure' && domain != 'viewport' && domain != 'document') {
        return this.derive(0, 0);
    }
    if (domain == this.domain) {
        return this.derive(this.x, this.y, this.domain);
    }
    if (domain == 'pure') {
        return this.derive(this.x, this.y);
    }
    if (this.domain == 'pure') {
        return this.derive(0, 0);
    }
    var offset = DOMVector.getScrollPosition('document');
    var x = this.x;
    var y = this.y;
    if (this.domain == 'document') {
        x -= offset.x;
        y -= offset.y;
    } else {
        x += offset.x;
        y += offset.y;
    }
    return this.derive(x, y, domain);
};
DOMVector.prototype.getDomain = function() {
    return this.domain;
};
DOMVector.from = function(width, height, domain) {
    return new DOMVector(width, height, domain);
};
DOMVector.getScrollPosition = function(domain) {
    domain = domain || 'document';
    var offset = getUnboundedScrollPosition(window);
    return this.from(offset.x, offset.y, 'document').convertTo(domain);
};
DOMVector.getElementPosition = function(elem, domain) {
    domain = domain || 'document';
    var offset = getElementPosition(elem);
    return this.from(offset.x, offset.y, 'viewport').convertTo(domain);
};
DOMVector.getElementDimensions = function(elem) {
    return this.from(elem.offsetWidth, elem.offsetHeight);
};
DOMVector.getViewportDimensions = function() {
    var dim = getViewportDimensions();
    return this.from(dim.width, dim.height, 'viewport');
};
DOMVector.getViewportWithoutScrollbarDimensions = function() {
    var dim = getViewportDimensions.withoutScrollbars();
    return this.from(dim.width, dim.height, 'viewport');
};
DOMVector.getDocumentDimensions = function(docRoot) {
    var dim = getDocumentScrollElement(docRoot);
    return this.from(dim.scrollWidth, dim.scrollHeight, 'document');
};

module.exports = DOMVector;