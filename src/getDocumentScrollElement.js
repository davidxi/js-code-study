/**
 * @providesModule getDocumentScrollElement
 */
var isWebKit = typeof navigator !== 'undefined' &&
    navigator.userAgent.indexOf('AppleWebKit') > -1;

function getDocumentScrollElement(docRoot /*or for frame doc node*/ ) {
    docRoot = docRoot || document;
    return !isWebKit && docRoot.compatMode === 'CSS1Compat' ?
        // "BackCompat" if the document is in quirks mode;
        // "CSS1Compat" if the document is in no-quirks (also known as "standards") mode
        docRoot.documentElement :
        docRoot.body;
}
module.exports = getDocumentScrollElement;