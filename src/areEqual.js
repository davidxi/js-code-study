/**
 * @providesModule areEqual
 */
var _areEqual = function(obj1, obj2, stack1, stack2) {
    if (obj1 === obj2) {
        return obj1 !== 0 || 1 / obj1 == 1 / obj2;
    }
    if (obj1 == null || obj2 == null) {
        return false;
    }
    if (typeof obj1 != 'object' || typeof obj2 != 'object') {
        return false;
    }

    var toString = Object.prototype.toString;
    var type1 = toString.call(obj1);
    if (type1 != toString.call(obj2)) {
        return false;
    }

    switch (type1) {
        case '[object String]':
            return obj1 == String(obj2);
        case '[object Number]':
            return isNaN(obj1) || isNaN(obj2) ? false : obj1 == Number(obj2);
        case '[object Date]':
        case '[object Boolean]':
            return +obj1 == +obj2;
        case '[object RegExp]':
            return obj1.source == obj2.source &&
                obj1.global == obj2.global &&
                obj1.multiline == obj2.multiline &&
                obj1.ignoreCase == obj2.ignoreCase;
    }

    // deal with circular references inside object
    var q = stack1.length;
    while (q--) {
        if (stack1[q] == obj1) {
            return stack2[q] == obj2;
        }
    }

    stack1.push(obj1);
    stack2.push(obj2);

    if (type1 === '[object Array]') {
        var len = obj1.length;
        if (len !== obj2.length) {
            return false;
        }
        while (len--) {
            if (!_areEqual(obj1[len], obj2[len], stack1, stack2)) {
                return false;
            }
        }
    } else {
        if (obj1.constructor !== obj2.constructor) {
            return false;
        }
        if (obj1.hasOwnProperty('valueOf') && obj2.hasOwnProperty('valueOf')) {
            return obj1.valueOf() == obj2.valueOf();
        }
        var keys1 = Object.keys(obj1);
        if (keys1.length != Object.keys(obj2).length) {
            return false;
        }
        for (var t = 0; t < keys1.length; t++) {
            if (!_areEqual(obj1[keys1[t]], obj2[keys1[t]], stack1, stack2)) {
                return false;
            }
        }
    }

    stack1.pop();
    stack2.pop();

    return true;
};

var stack1_recycled = [];
var stack2_recycled = [];

var areEqual = function(obj1, obj2) {
    var stack1 = stack1_recycled.length ? stack1_recycled.pop() : [];
    var stack2 = stack2_recycled.length ? stack2_recycled.pop() : [];

    var ret = _areEqual(obj1, obj2, stack1, stack2);

    stack1.length = 0;
    stack2.length = 0;
    stack1_recycled.push(stack1);
    stack2_recycled.push(stack2);

    return ret;
};

module.exports = areEqual;