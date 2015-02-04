/**
 * @providesModule Stopwatch
 */
var performanceNow = require('./performanceNow');

function Stopwatch() {
    this.reset();
}
Stopwatch.prototype.reset = function() {
    this._timestamp = performanceNow();
};
Stopwatch.prototype.read = function() {
    return performanceNow() - this._timestamp;
};

module.exports = Stopwatch;