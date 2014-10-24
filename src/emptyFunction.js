/**
 * @providesModule emptyFunction
 */
var copyProperties = require('./copyProperties.js');

function makeEmptyFunction(arg) {
    return function() {
        return arg;
    };
}

function emptyFunction() {}

copyProperties(emptyFunction, {
    thatReturns: makeEmptyFunction,
    thatReturnsFalse: makeEmptyFunction(false),
    thatReturnsTrue: makeEmptyFunction(true),
    thatReturnsNull: makeEmptyFunction(null),
    thatReturnsThis: function() {
        return this;
    },
    thatReturnsArgument: function(arg) {
        return arg;
    }
});

module.exports = emptyFunction;