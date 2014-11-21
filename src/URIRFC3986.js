/**
 * @providesModule URIRFC3986
 */
var regexURI = new RegExp('^' + '([^:/?#]+:)?' + '(//' + '([^\\\\/?#@]*@)?' + '(' + '\\[[A-Fa-f0-9:.]+\\]|' + '[^\\/?#:]*' + ')' + '(:[0-9]*)?' + ')?' + '([^?#]*)' + '(\\?[^#]*)?' + '(#.*)?');
var URIRFC3986 = {
    parse: function(href) {
        if (href.trim() === '') {
            return null;
        }
        var j = href.match(regexURI);
        var parsed = {};
        parsed.uri = j[0] ? j[0] : null;
        parsed.scheme = j[1] ? j[1].substr(0, j[1].length - 1) : null;
        parsed.authority = j[2] ? j[2].substr(2) : null;
        parsed.userinfo = j[3] ? j[3].substr(0, j[3].length - 1) : null;
        parsed.host = j[2] ? j[4] : null;
        parsed.port = j[5] ? (j[5].substr(1) ? parseInt(j[5].substr(1), 10) : null) : null;
        parsed.path = j[6] ? j[6] : null;
        parsed.query = j[7] ? j[7].substr(1) : null;
        parsed.fragment = j[8] ? j[8].substr(1) : null;
        parsed.isGenericURI = parsed.authority === null && !!parsed.scheme;
        return parsed;
    }
};
module.exports = URIRFC3986;