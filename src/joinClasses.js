/**
 * @providesModule joinClasses
 */
function joinClasses(classname) {
    if (!classname) {
        classname = '';
    }
    var i, j = arguments.length;
    if (j > 1) {
        for (var k = 1; k < j; k++) {
            i = arguments[k];
            if (i) {
                classname = (classname ? classname + ' ' : '') + i;
                // @todo: this ternary is redundant?
            }
        }
    }
    return classname;
}
module.exports = joinClasses;