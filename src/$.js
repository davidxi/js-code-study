/**
 *  @providesModule $
 */
var ex = require('./ex.js');

function $(id) {
    var node = typeof id === 'string' ?
                document.getElementById(id) :
                id;
    if (!node) {
        throw new Error(ex('Tried to get element with id of "%s" but it is not present on the page.', id));
    }
    return node;
}

function wrapper(id) {
    return $(id);
}

wrapper.unsafe = $;
module.exports = wrapper;