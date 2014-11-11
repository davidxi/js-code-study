/**
 * @providesModule ge
 */
function ge(id /*needle*/, node /*to start*/, tagName /*filter*/) {
    return typeof id != 'string' ?
            id :
            !node ? document.getElementById(id) : getNodeById(id, node, tagName);
}

function getNodeById(id /*needle*/ , node /*to start*/ , tagName /*filter*/ ) {
    var found, n, o;
    if (getNodeId(node) == id) {
        return node;
    } else if (node.getElementsByTagName) {
        n = node.getElementsByTagName(tagName || '*');
        for (o = 0; o < n.length; o++)
            if (getNodeId(n[o]) == id)
                return n[o];
    } else {
        n = node.childNodes;
        for (o = 0; o < n.length; o++) {
            found = getNodeById(id, n[o]);
            if (found)
                return found;
        }
    }
    return null;
}

function getNodeId(node) {
    return node.getAttribute ? node.getAttribute('id') : null;
}

module.exports = ge;