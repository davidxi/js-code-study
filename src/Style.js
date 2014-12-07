/**
 * @providesModule Style
 */
var StyleUpstream = require('Style-upstream');
var $ = require('$');
var merge = require('merge');

var Style = merge(StyleUpstream, {
    get: function(elemId, prop) {
        typeof elemId === 'string';
        return StyleUpstream.get($(elemId), prop);
    },
    getFloat: function(elemId, prop) {
        typeof elemId === 'string';
        return StyleUpstream.getFloat($(elemId), prop);
    }
});
module.exports = Style;