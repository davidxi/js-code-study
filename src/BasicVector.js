/**
 * @providesModule BasicVector
 */
function BasicVector(x, y) {
    this.x = x;
    this.y = y;
}
BasicVector.prototype.derive = function(x, y) {
    return new BasicVector(x, y);
};
BasicVector.prototype.toString = function() {
    return '(' + this.x + ', ' + this.y + ')';
};
BasicVector.prototype.add = function(x, y) {
    if (x instanceof BasicVector) {
        y = x.y;
        x = x.x;
    }
    return this.derive(
        this.x + parseFloat(x),
        this.y + parseFloat(y)
    );
};
BasicVector.prototype.mul = function(x, y) {
    if (y === undefined) {
        y = x;
    }
    return this.derive(this.x * x, this.y * y);
};
BasicVector.prototype.div = function(x, y) {
    if (y === undefined) {
        y = x;
    }
    return this.derive(this.x * 1 / x, this.y * 1 / y);
};
BasicVector.prototype.sub = function(x, y) {
    if (arguments.length === 1) { // @todo: should use instanceof, in case 'x.mul' is undefined ?
        return this.add(x.mul(-1));
    } else {
        return this.add(-x, -y);
    }
};
BasicVector.prototype.distanceTo = function(vector) {
    return this.sub(vector).magnitude();
};
BasicVector.prototype.magnitude = function() {
    return Math.sqrt((this.x * this.x) + (this.y * this.y));
};
BasicVector.prototype.rotate = function(angle) {
    return this.derive(this.x * Math.cos(angle) - this.y * Math.sin(angle), this.x * Math.sin(angle) + this.y * Math.cos(angle));
};
module.exports = BasicVector;