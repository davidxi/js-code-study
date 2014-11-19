/**
 * @providesModule escapeTextForBrowser
 */
var escapeMap = {
    "&": "&amp;",
    ">": "&gt;",
    "<": "&lt;",
    "\"": "&quot;",
    "'": "&#x27;"
};

function escapeTextForBrowser(k) {
    return ('' + k).replace(/[&><"']/g, function(char) {
        return escapeMap[char];
    });
}
module.exports = escapeTextForBrowser;