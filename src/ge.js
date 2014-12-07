/**
 * @providesModule ge
 */
function ge(id /*needle*/, node /*to start*/, tagName /*filter*/) {
    return typeof id != 'string' ?
            id :
            !node ? document.getElementById(id) : getNodeById(id, node, tagName);
}

function getNodeById(id /*needle*/ , node /*to start*/ , tagName /*filter*/ ) {
    var found, candidateElements, o;
    if (getNodeId(node) == id) {
        return node;
    } else if (node.getElementsByTagName) {
        candidateElements = node.getElementsByTagName(tagName || '*');
        for (o = 0; o < candidateElements.length; o++) {
            if (getNodeId(candidateElements[o]) == id) {
                return candidateElements[o];
            }
        }
    } else {
        // 'filterByTagName' mode when Element.getElementsByTagName() is not supported,
        // try every child node.
        candidateElements = node.childNodes;
        for (o = 0; o < candidateElements.length; o++) {
            found = getNodeById(id, candidateElements[o]);
            if (found) {
                return found;
            }
        }
    }
    return null;
}

function getNodeId(node) {
    return node.getAttribute ? node.getAttribute('id') : null;
}

module.exports = ge;