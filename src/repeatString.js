/**
 * @providesModule repeatString
 */
var invariant = require('invariant');

function repeatString(str, count) {
    if (count === 1) {
        return str;
    }
    invariant(count >= 0);
    var ret = '';
    while (count) {
        if (count & 1) {
            ret += str;
        }
        if ((count >>= 1)) { // O(Log(N))
            str += str;
        }
    }
    return ret;
}
module.exports = repeatString;