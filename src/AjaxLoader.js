/**
 * @providesModule AjaxLoader
 */
var copyProperties = require('copyProperties');
var FBAjaxRequest = require('FBAjaxRequest');
var BaseAsyncLoader = require('BaseAsyncLoader');

function AjaxLoader(endpont, type) {
    // props used by BaseAsyncLoader::getLoader()
    this._endpoint = endpont;
    this._type = type;
}

copyProperties(AjaxLoader.prototype, BaseAsyncLoader.prototype);

AjaxLoader.prototype.send = function(uri, ids, _, cbOnJSON, cbOnError) {
    var ajaxRequest = new FBAjaxRequest('GET', uri, {
        ids: ids
    });
    ajaxRequest.onJSON = function(response) {
        cbOnJSON({
            payload: response.json
        });
    };
    ajaxRequest.onError = cbOnError;
    ajaxRequest.send();
};

module.exports = AjaxLoader;