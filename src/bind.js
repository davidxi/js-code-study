/**
 * @providesModule bind
 */
function bind(obj, method) {
    var args = Array.prototype.slice.call(arguments, 2);
    if (typeof method != 'string') {
        return Function.prototype.bind.apply(method, [obj].concat(args));
    }

    function wrapped() {
        var args_ = args.concat(Array.prototype.slice.call(arguments));
        if (obj[method]) {
            return obj[method].apply(obj, args_);
        }
    }
    wrapped.toString = function() {
        return 'bound lazily: ' + obj[method];
    };
    return wrapped;
}
module.exports = bind;