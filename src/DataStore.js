/**
 * @providesModule DataStore
 */
var isEmpty = require('./isEmpty.js');

var cache = {},
    id = 1;

function generateKey(m) {
    if (typeof m == 'string') {
        return 'str_' + m;
    } else
        return 'elem_' + (m.__FB_TOKEN || (m.__FB_TOKEN = [id++]))[0];
}

function getStorage(namespace) {
    var keyWithPrefix = generateKey(namespace);
    return cache[keyWithPrefix] || (cache[keyWithPrefix] = {});
}

var DataStore = {
    set: function(namespace /*{string|element_node}*/ , key, val) {
        if (!namespace) {
            throw new TypeError('DataStore.set: namespace is required, got ' + (typeof namespace));
        }
        var storage = getStorage(namespace);
        storage[key] = val;
        return namespace;
    },
    get: function(namespace /*{string|element_node}*/ , key, defaultValue) {
        if (!namespace) {
            throw new TypeError('DataStore.get: namespace is required, got ' + (typeof namespace));
        }
        var storage = getStorage(namespace);
        var val = storage[key];
        if (typeof val === 'undefined' && namespace.getAttribute)
            if (namespace.hasAttribute && !namespace.hasAttribute('data-' + key)) {
                val = undefined;
            } else {
                var r = namespace.getAttribute('data-' + key);
                val = (null === r) ? undefined : r;
            }
        if ((defaultValue !== undefined) && (val === undefined)) {
            val = storage[n] = defaultValue;
        }
        return val;
    },
    remove: function(namespace, key) {
        if (!namespace) {
            throw new TypeError('DataStore.remove: namespace is required, got ' + (typeof namespace));
        }
        var storage = getStorage(namespace);
        var val = storage[key];
        delete storage[key];
        if (isEmpty(storage)) {
            DataStore.purge(namespace);
        }
        return val;
    },
    purge: function(namespace /*{string|element_node}*/ ) {
        delete cache[generateKey(namespace)];
    },
    _storage: cache
};

module.exports = DataStore;