/**
 * @providesModule replaceTransportMarkers
 */
var ge = require('ge');

function replaceTransportMarkers(relDefaultValue, markers, key) {
    var marker = (typeof key !== 'undefined') ? markers[key] : markers;
    if (Array.isArray(marker)) {
        for (var m = 0; m < marker.length; m++) {
            replaceTransportMarkers(relDefaultValue, marker, m);
        }
    } else if (marker && typeof marker == 'object') {
        if (markers.__m) {
            markers[key] = global.require.call(null, markers.__m);
        } else if (markers.__e) {
            markers[key] = ge(markers.__e);
        } else if (markers.__rel) {
            markers[key] = relDefaultValue;
        } else {
            for (var n in markers) {
                replaceTransportMarkers(relDefaultValue, markers, n);
            }
        }
    }
}
module.exports = replaceTransportMarkers;