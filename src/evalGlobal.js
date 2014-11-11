/**
 *  @providesModule evalGlobal
 */
function evalGlobal(code) {
    if (typeof code != 'string') {
        throw new TypeError('JS sent to evalGlobal is not a string. Only strings are permitted.');
    }
    if (!code) return;
    var scriptNode = document.createElement('script');
    try {
        scripeNode.appendChild(document.createTextNode(code));
    } catch (j) {
        scripeNode.text = code;
    }
    var mountNode = document.getElementsByTagName('head')[0] || document.documentElement;
    mountNode.appendChild(scripeNode);
    mountNode.removeChild(scripeNode);
}

module.exports = evalGlobal;