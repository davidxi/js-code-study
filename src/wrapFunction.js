/**
 * @providesModule wrapFunction
 */
var memo = {};

function wrapFunction(fn, name, firstArg) {
    name = name || 'default';
    return function() {
        var fn = name in memo ? memo[name](fn, firstArg) : fn;
        return fn.apply(this, arguments);
    };
}

wrapFunction.setWrapper = function(fn, name) {
    name = name || 'default';
    memo[name] = fn;
};

module.exports = wrapFunction;