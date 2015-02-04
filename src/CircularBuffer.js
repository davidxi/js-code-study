/**
 * @providesModule CircularBuffer
 */
var invariant = require('./invariant');

function CircularBuffer(maxLen) {
    invariant(maxLen > 0);
    this._maxLen = maxLen;
    this._pointer = 0;
    this._buffer = [];
}
CircularBuffer.prototype.write = function(data) {
    if (this._buffer.length < this._maxLen) {
        this._buffer.push(data);
    } else {
        this._buffer[this._pointer] = data;
        this._pointer++;
        this._pointer %= this._maxLen;
    }
    return this;
};
CircularBuffer.prototype.read = function() {
    return this._buffer.
            // circular -> [pointer - n] + [0 - pointer]
            slice(this._pointer).
            concat(this._buffer.slice(0, this._pointer));
};
CircularBuffer.prototype.clear = function() {
    this._pointer = 0;
    this._buffer = [];
    return this;
};
module.exports = CircularBuffer;