/**
 * @providesModule substituteTokens
 */
var invariant = require('./invariant');
var Intl = require('./Intl');

function substituteTokens(template, data) {
    if (!data) {
        return template;
    }
    invariant(typeof data === 'object');

    // Intl.endsInPunct.punct_char_class =
    // '[' + '.!?' + '\u3002' + '\uFF01' + '\uFF1F' + '\u0964' + '\u2026' + '\u0EAF' + '\u1801' + '\u0E2F' + '\uFF0E' + ']'

    var regexVariable = new RegExp('\\{([^}]+)\\}(' + Intl.endsInPunct.punct_char_class + '*)', 'g');
    var values = [];
    var keys = [];
    var blocks = template.replace(regexVariable, function(match, key, punctChar) {
        var value = data[key];
        if (value && typeof value === 'object') {
            values.push(value);
            keys.push(key);
            return '\x17' + punctChar;
        } else if (value === null) {
            return '';
        }
        return value + (Intl.endsInPunct(value) ? '' : punctChar);
    }).split('\x17').map(Intl.applyPhonologicalRules);

    if (blocks.length === 1) {
        return blocks[0];
    }
    var results = [blocks[0]];
    for (var s = 0; s < values.length; s++) {
        results.push(values[s], blocks[s + 1]);
    }
    return results;
}
module.exports = substituteTokens;