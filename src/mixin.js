/**
 * @providesModule mixin
 */
function mixin(h, i, j, k, l, m, n, o, p, q, r) {
    var Klass = function() {};
    // @param(r) is used to promt args length limit warning in __DEV__
    var mixinKlasses = [h, i, j, k, l, m, n, o, p, q];
    var index = 0;
    var mixinKlass;
    while (mixinKlasses[index]) {
        mixinKlass = mixinKlasses[index];
        for (var w in mixinKlass) {
            if (mixinKlass.hasOwnProperty(w)) {
                Klass.prototype[w] = mixinKlass[w];
            }
        }
        index += 1; // @todo: why not just use ++index in while condition and set index = -1 in initial?
    }
    return Klass;
}
module.exports = mixin;