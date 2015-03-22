/**
 * @providesModule coalesce
 */
function coalesce() {
    for (var h = 0; h < arguments.length; ++h) {
        if (arguments[h] != null) {
            return arguments[h];
        }
    }
    return null;
}
module.exports = coalesce;