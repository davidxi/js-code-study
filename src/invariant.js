/**
 * @providesModule invariant
 */

var invariantDev = function(condition, format, a, b, c, d, e, f) {
    if (format === undefined && !condition) {
        throw new Error('Invariant Violation');
    }

    if (!condition) {
        var args = [a, b, c, d, e, f];
        var argIndex = 0;
        throw new Error(
            'Invariant Violation: ' +
            format.replace(/%s/g, function() {
                return args[argIndex++];
            })
        );
    }
};

module.exports = invariantDev;