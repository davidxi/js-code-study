/**
 * @providesModule QueryString
 */
function encode(kvpairs) {
    var params = [];
    Object.keys(kvpairs).sort().forEach(function(key) {
        var val = kvpairs[key];
        if (typeof val === 'undefined')
            return;
        if (val === null) {
            params.push(key);
            return;
        }
        params.push(encodeURIComponent(key) + '=' + encodeURIComponent(val));
    });
    return params.join('&');
}

function decode(queryStr, isDisallowDuplicate) {
    var kvpairs = {};
    if (queryStr === '')
        return kvpairs;
    var params = queryStr.split('&');
    for (var o = 0; o < params.length; o++) {
        var p = params[o].split('=', 2);
        var key = decodeURIComponent(p[0]);
        if (isDisallowDuplicate && kvpairs.hasOwnProperty(key))
            throw new URIError('Duplicate key: ' + key);
        kvpairs[key] = p.length === 2 ? decodeURIComponent(p[1]) : null;
    }
    return kvpairs;
}

function appendToUrl(base, append) {
    return base + (~base.indexOf('?') ? '&' : '?') + 
            (typeof append === 'string' ? append : QueryString.encode(append));
}

var QueryString = {
    encode: encode,
    decode: decode,
    appendToUrl: appendToUrl
};

module.exports = QueryString;