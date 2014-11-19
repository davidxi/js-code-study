/**
 * @providesModule escapeJSQuotes
 */
function escapeJSQuotes(h) {
    if (typeof h == 'undefined' || h == null || !h.valueOf()) {
        return '';
    }
    return h.toString()
        .replace(/\\/g, '\\\\')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/"/g, '\\x22')
        .replace(/'/g, '\\\'')
        .replace(/</g, '\\x3c')
        .replace(/>/g, '\\x3e')
        .replace(/&/g, '\\x26');
}
module.exports = escapeJSQuotes;