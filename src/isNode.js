/**
 * @providesModule isNode
 */
/**
 * @param {*} object The object to check.
 * @return {boolean} Whether or not the object is a DOM node.
 */
function isNode(object) {
    return !!(object && (
        typeof Node === 'function' ? object instanceof Node :
        typeof object === 'object' &&
        typeof object.nodeType === 'number' &&
        typeof object.nodeName === 'string'
    ));
}

module.exports = isNode;