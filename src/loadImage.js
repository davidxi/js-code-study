/**
 * @providesModule loadImage
 */
function loadImage(src, onload) {
    var j = new Image();
    j.onload = function() {
        onload(j.width, j.height, j);
    };
    j.src = src;
}
module.exports = loadImage;