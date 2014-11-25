/**
 * @providesModule JSCC
 */
var cache = {};

function once(initializeFn) {
    var result;
    var initialized = false;
    return function() {
        if (!initialized) {
            result = initializeFn();
            initialized = true;
        }
        return result;
    };
}
var JSCC = {
    get: function(entry /*hash string*/ ) {
        if (!cache[entry]) {
            throw new Error('JSCC entry is missing');
        }
        return cache[entry]();
    },
    init: function(initializeFnMap) {
        for (var k in initializeFnMap) {
            cache[k] = once(initializeFnMap[k]);
        }
        return function reset() {
            for (var m in initializeFnMap) {
                delete cache[m];
            }
        };
    }
};
module.exports = JSCC;