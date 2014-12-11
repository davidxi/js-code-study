/**
 * @providesModule BitMap
 */
var repeatString = require('repeatString');

var CHAR_MAP_64 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_';

function BitMap() {
    this._bits = [];
}
BitMap.prototype.set = function(index) {
    this._bits[index] = 1;
    return this;
};
BitMap.prototype.toString = function() {
    var binary = [];
    for (var m = 0; m < this._bits.length; m++) {
        binary.push(this._bits[m] ? 1 : 0);
    }
    return binary.length ?
        convertTo64Char(binary.join('')) :
        '';
};
BitMap.prototype.toCompressedString = function() {
    if (this._bits.length === 0) {
        return '';
    }
    var binary = [];
    var lenConsecutiveSame = 1;
    var lastDigit = this._bits[0] || 0;
    var leadingDigit = lastDigit.toString(2);
    for (var p = 1; p < this._bits.length; p++) {
        var currentDigit = this._bits[p] || 0;
        if (currentDigit === lastDigit) {
            lenConsecutiveSame++;
        } else {
            binary.push(genUniqStr(lenConsecutiveSame));
            lastDigit = currentDigit;
            lenConsecutiveSame = 1;
        }
    }
    if (lenConsecutiveSame) {
        binary.push(genUniqStr(lenConsecutiveSame));
    }
    return convertTo64Char(leadingDigit + binary.join(''));
};

function genUniqStr(num) { // @todo: not sure this is for generating unique str purpose ?
    var m = num.toString(2);
    var n = repeatString('0', m.length - 1);
    return n + m;
}

function convertTo64Char(binary) {
    // 2^6 --> 64 --> CHAR_MAP_64.length
    var everySixDigits = (binary + '00000').match(/[01]{6}/g);
    var ret = '';
    for (var o = 0; o < everySixDigits.length; o++)
        ret += CHAR_MAP_64[parseInt(everySixDigits[o], 2)];
    return ret;
}
module.exports = BitMap;