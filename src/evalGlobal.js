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
        scriptNode.appendChild(document.createTextNode(code));
    } catch (j) {
        scriptNode.text = code;
    }
    var mountNode = document.getElementsByTagName('head')[0] || document.documentElement;
    mountNode.appendChild(scriptNode);
    mountNode.removeChild(scriptNode);
}

module.exports = evalGlobal;