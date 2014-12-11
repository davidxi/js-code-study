/**
 * @providesModule getSameOriginTransport
 */
var ex = require('ex');

function getSameOriginTransport() {
    try {
        return global.XMLHttpRequest ?
            new global.XMLHttpRequest() :
            new global.ActiveXObject("MSXML2.XMLHTTP.3.0");
    } catch (err) {
        throw new Error(ex('getSameOriginTransport: %s', err.message));
    }
}
module.exports = getSameOriginTransport;