/**
 * @providesModule ServerJSDefine
 */
var BitMap = require('BitMap');
var replaceTransportMarkers = require('replaceTransportMarkers');

var bitmap = new BitMap();
var ServerJSDefine = {
    getLoadedModuleHash: function() {
        return bitmap.toCompressedString();
    },
    handleDefine: function(moduleId, deps, markers, moduleUnid, defaultRelValue) {
        bitmap.set(moduleUnid);
        global.define(moduleId, deps, function() {
            replaceTransportMarkers(defaultRelValue, markers);
            return markers;
        });
    },
    handleDefines: function(tuples, defaultRelValue) {
        // example of server JS define tuples: 
        // [
        //   ["BootloaderConfig",[],{},329],
        //   ["CSSLoaderConfig",[],{"timeout":5000},619]
        // ]
        tuples.map(function(m) {
            if (defaultRelValue) {
                m.push(defaultRelValue);
            }
            ServerJSDefine.handleDefine.apply(null, m);
        });
    }
};
module.exports = ServerJSDefine;