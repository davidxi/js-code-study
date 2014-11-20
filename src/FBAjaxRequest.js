/**
 * @providesModule FBAjaxRequest
 */
var AjaxRequest = require('AjaxRequest');
var copyProperties = require('copyProperties');
var getAsyncParams = require('getAsyncParams');

function FBAjaxRequest(httpMethod, uri, params) {
    // copy global user data (token/id) to ajax params
    params = copyProperties(getAsyncParams(httpMethod), params);
    // intialize from base constructor
    var ajaxRequest = new AjaxRequest(httpMethod, uri, params);
    // do not use 'process on partial received data' mode
    ajaxRequest.streamMode = false;

    // overwrite _call()
    var _call_orig = ajaxRequest._call;
    ajaxRequest._call = function(method) {
        if (method == 'onJSON' && this.json) {
            if (this.json.error) {
                this.errorType = AjaxRequest.SERVER_ERROR;
                this.errorText = 'AsyncResponse error: ' + this.json.error;
            }
            this.json = this.json.payload;
        }
        _call_orig.apply(this, arguments);
    };

    // overwrite send()
    ajaxRequest.ajaxReqSend = ajaxRequest.send;
    ajaxRequest.send = function(data) {
        this.ajaxReqSend(copyProperties(data, params));
    };

    return ajaxRequest;
}
module.exports = FBAjaxRequest;