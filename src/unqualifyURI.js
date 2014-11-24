/**
 * @providesModule unqualifyURI
 */
function unqualifyURI(uriInstance /*URI instance*/ ) {
    uriInstance.setProtocol(null).setDomain(null).setPort(null);
}
module.exports = unqualifyURI;