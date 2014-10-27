/**
 * @providesModule ex
 */
 
var ex = function() {
    var i = [];
    for (var j = 0, k = arguments.length; j < k; j++) {
        i.push(arguments[j]);
    }
    i = i.map(function(l) {
        return String(l);
    });

    if (i[0].split('%s').length !== i.length) {
        return ex('ex args number mismatch: %s', JSON.stringify(i));
    }
    return ex._prefix + JSON.stringify(i) + ex._suffix;
};

ex._prefix = '<![EX[';
ex._suffix = ']]>';

module.exports = ex;