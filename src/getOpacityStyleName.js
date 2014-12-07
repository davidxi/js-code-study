/**
 * @providesModule getOpacityStyleName
 */
var cached = false,
    result = null;

function getOpacityStyleName() {
    if (!cached) {
        if ('opacity' in document.body.style) {
            result = 'opacity';
        } else {
            // avoid re-paint, create an offline element to detect
            var temp = document.createElement('div');
            temp.style.filter = 'alpha(opacity=100)';
            if (temp.style.filter) {
                result = 'filter';
            }
            temp = null;
        }
        cached = true;
    }
    return result;
}
module.exports = getOpacityStyleName;