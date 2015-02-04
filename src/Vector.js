/**
 * @providesModule Vector
 */
var DOMVector = require('./DOMVector');
var Event = require('./Event');

for (var i in DOMVector) {
    if (DOMVector.hasOwnProperty(i)) {
        Vector[i] = DOMVector[i];
    }
}
var protoDOMVector = DOMVector === null ? null : DOMVector.prototype;
Vector.prototype = Object.create(protoDOMVector);
Vector.prototype.constructor = Vector;
Vector.__superConstructor__ = DOMVector;

function Vector(width, height, domain) {
    DOMVector.call(this, parseFloat(width), parseFloat(height), domain);
}
Vector.prototype.derive = function(width, height, domain) {
    return new Vector(width, height, domain || this.domain);
};
Vector.prototype.setElementPosition = function(elem) {
    var offset = this.convertTo('document');
    elem.style.left = parseInt(offset.x, 10) + 'px';
    elem.style.top = parseInt(offset.y, 10) + 'px';
    return this;
};
Vector.prototype.setElementDimensions = function(elem) {
    return this.setElementWidth(elem).setElementHeight(elem); // @todo:  batch update 2 dom op?
};
Vector.prototype.setElementWidth = function(elem) {
    elem.style.width = parseInt(this.x, 10) + 'px';
    return this;
};
Vector.prototype.setElementHeight = function(elem) {
    elem.style.height = parseInt(this.y, 10) + 'px';
    return this;
};
Vector.prototype.scrollElementBy = function(elem) {
    if (elem == document.body) {
        window.scrollBy(this.x, this.y);
    } else {
        elem.scrollLeft += this.x;
        elem.scrollTop += this.y;
    }
    return this;
};
Vector.from = function(width, height, domain) {
    return new Vector(width, height, domain);
};
Vector.getEventPosition = function(event, domain) {
    domain = domain || 'document';
    var offset = Event.getPosition(event);
    var vector = this.from(offset.x, offset.y, 'document');
    return vector.convertTo(domain);
};
Vector.deserialize = function(str/*like '3,4' */) {
    var m = str.split(',');
    return this.from(m[0], m[1]);
};
module.exports = Vector;