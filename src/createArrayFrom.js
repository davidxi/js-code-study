/**
 * @providesModule createArrayFrom
 */
var toArray = require('./toArray.js');

function hasArrayNature(obj) {
    return (
        // not null/false
        !!obj &&
        // arrays are objects, NodeLists are functions in Safari
        (typeof obj === 'object' || typeof obj === 'function') &&
        // quacks like an array
        ('length' in obj) &&
        // not window
        !('setInterval' in obj) &&
        // no DOM node should be considered an array-like
        // a 'select' element has 'length' and 'item' properties on IE8
        (typeof obj.nodeType !== 'number') &&
        (
            // a real array
            Array.isArray(obj) ||
            // arguments
            ('callee' in obj) ||
            // HTMLCollection/NodeList
            ('item' in obj)
        )
    );
}

function createArrayFrom(obj) {
    if (!hasArrayNature(obj)) {
        return [obj];
    } else if (Array.isArray(obj)) {
        return obj.slice();
    } else {
        return toArray(obj);
    }
}

module.exports = createArrayFrom;