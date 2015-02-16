/**
 * @providesModule AsyncUploadBase
 */
var ArbiterMixin = require('./ArbiterMixin');
var AsyncRequest = require('./AsyncRequest');
var AsyncResponse = require('./AsyncResponse');
var BrowserSupport = require('./BrowserSupport');
var Form = require('./Form');
var copyProperties = require('./copyProperties');
var mixin = require('./mixin');
var removeFromArray = require('./removeFromArray');

var ArbiterInstanceFacade = mixin(ArbiterMixin); // @todo: the purpose of using mixin pattern ?
for (var p in ArbiterInstanceFacade) {
    if (ArbiterInstanceFacade.hasOwnProperty(p)) {
        AsyncUploadBase[p] = ArbiterInstanceFacade[p];
    }
}
var protoArbiter = ArbiterInstanceFacade === null ? null : ArbiterInstanceFacade.prototype;
AsyncUploadBase.prototype = Object.create(protoArbiter);
AsyncUploadBase.prototype.constructor = AsyncUploadBase;
AsyncUploadBase.__superConstructor__ = ArbiterInstanceFacade;
AsyncUploadBase.parseFiles = function(_filesMap) {
    var filesMap = {};
    for (var fileName in _filesMap) {
        var filesObj = _filesMap[fileName];
        if (Array.isArray(filesObj)) {
            filesMap[fileName] = filesObj;
        } else {
            filesMap[fileName] = [];
            if (filesObj instanceof window.FileList) {
                for (var x = 0; x < filesObj.length; x++) {
                    filesMap[fileName].push(filesObj.item(x));
                }
            } else if (filesObj instanceof window.File || filesObj instanceof window.Blob) {
                filesMap[fileName].push(filesObj);
            }
        }
    }
    return filesMap;
};

function AsyncUploadBase(uri) {
    this.setURI(uri);
    this.setNetworkErrorRetryLimit(0);
}
AsyncUploadBase.prototype.setAllowCrossOrigin = function(allowCrossOrigin) {
    this._allowCrossOrigin = !!allowCrossOrigin;
    return this;
};
AsyncUploadBase.prototype.setAllowCrossPageTransition = function(allowCrossPageTransition) {
    this._allowCrossPageTransition = !!allowCrossPageTransition;
    return this;
};
AsyncUploadBase.prototype.setData = function(data) {
    this._data = data;
    return this;
};
AsyncUploadBase.prototype.setNetworkErrorRetryLimit = function(retryLimit) {
    this._retryLimit = retryLimit;
    return this;
};
AsyncUploadBase.prototype.setLimit = function(limit) {
    this._limit = limit;
    return this;
};
AsyncUploadBase.prototype.setPreprocessHandler = function(preprocessHanlder) {
    this._preprocessHandler = preprocessHanlder;
    return this;
};
AsyncUploadBase.prototype.setRelativeTo = function(relativeTo) {
    this._relativeTo = relativeTo;
    return this;
};
AsyncUploadBase.prototype.setStatusElement = function(statusElement) {
    this._statusElement = statusElement;
    return this;
};
AsyncUploadBase.prototype.setURI = function(uri) {
    this._uri = uri;
    return this;
};
AsyncUploadBase.prototype.suspend = function() {
    this._suspended = true;
    return this;
};
AsyncUploadBase.prototype.resume = function() {
    this._suspended = false;
    this._processQueue();
    return this;
};
AsyncUploadBase.prototype.isUploading = function() {
    return this._inFlight;
};
AsyncUploadBase.prototype._createFileUpload = function(name, file, data) {
    return new FileUpload(name, file, data);
};
AsyncUploadBase.prototype._processQueue = function() {
    if (this._suspended) {
        return;
    }
    /**
     * this._uploads[] --> array of AsyncUploadBase::FileUpload instances
     */
    while (this._pending.length < this._limit) {
        if (!this._waiting.length) {
            break;
        }
        var fileUpload = this._waiting.shift();
        if (this._preprocessHandler) {
            this._preprocessHandler(fileUpload, this._processUpload.bind(this));
        } else {
            this._processUpload(fileUpload);
        }
        this._pending.push(fileUpload);
    }
};
AsyncUploadBase.prototype._processUpload = function(fileUpload /*instance*/ ) {
    var rawData = Form.createFormData(fileUpload.getData() || this._data);
    // 'rawData' is a FormData object
    // https://developer.mozilla.org/en-US/docs/Web/API/FormData
    if (fileUpload.getFile()) {
        // 'append()' appends a key/value pair to the FormData object.
        rawData.append(fileUpload.getName(), fileUpload.getFile());
        var uploadId = fileUpload.getFile().uploadID;
        if (uploadId) {
            rawData.append('upload_id', uploadId);
        }
    }
    var asyncRequest =
        new AsyncRequest().
    setAllowCrossOrigin(this._allowCrossOrigin).
    setAllowCrossPageTransition(this._allowCrossPageTransition).
    setURI(this._uri).
    setRawData(rawData).
    setStatusElement(this._statusElement).
    setHandler(this._success.bind(this, fileUpload)).
    setErrorHandler(this._failure.bind(this, fileUpload)).
    setUploadProgressHandler(this._progress.bind(this, fileUpload)).
    setInitialHandler(this._initial.bind(this, fileUpload));

    if (this._relativeTo) {
        asyncRequest.setRelativeTo(this._relativeTo);
    }
    asyncRequest.send();
    fileUpload.setAsyncRequest(asyncRequest);
    this._inFlight = true;
    if (!fileUpload.getRetryCount()) {
        this.inform('start', fileUpload);
    }
};
AsyncUploadBase.prototype._abort = function(fileUpload /*instance*/ ) {
    if (this._pending.indexOf(fileUpload) !== -1) {
        removeFromArray(this._pending, fileUpload);
        this._processQueue();
    }
    removeFromArray(this._waiting, fileUpload);
    fileUpload.abort();
};
AsyncUploadBase.prototype._initial = function(fileUpload /*instance*/ ) {
    if (fileUpload.isAborted()) {
        return;
    }
    this.inform('initial', fileUpload);
};
AsyncUploadBase.prototype._success = function(fileUpload /*instance*/ , response) {
    if (fileUpload.isAborted()) {
        this.inform('success_after_abort', response);
        return;
    }
    this._complete(fileUpload);
    this.inform('success', fileUpload.handleSuccess(response));
    this._processQueue();
};
AsyncUploadBase.prototype._retryUpload = function(fileUpload /*instance*/ ) {
    fileUpload.increaseRetryCount();
    this._processUpload(fileUpload);
};
AsyncUploadBase.prototype._failure = function(fileUpload /*instance*/ , response) {
    if (fileUpload.isAborted()) {
        return;
    }
    if (response.error === 1004 && fileUpload.getRetryCount() < this._retryLimit) {
        return this._retryUpload(fileUpload);
    }
    this._complete(fileUpload);
    if (this.inform('failure', fileUpload.handleFailure(response)) !== false) {
        AsyncResponse.defaultErrorHandler(response);
    }
    this._processQueue();
};
AsyncUploadBase.prototype._progress = function(fileUpload /*instance*/ , event) {
    if (fileUpload.isAborted()) {
        return;
    }
    this.inform('progress', fileUpload.handleProgress(event));
};
AsyncUploadBase.prototype._complete = function(fileUpload /*instance*/ ) {
    removeFromArray(this._pending, fileUpload);
    if (!this._pending.length) {
        this._inFlight = false;
    }
};
AsyncUploadBase.isSupported = function() {
    return BrowserSupport.hasFileAPI();
};
copyProperties(AsyncUploadBase.prototype, {
    _limit: 10
});

function FileUpload(name, file, data) {
    this._name = name;
    this._file = file;
    this._data = data;
    this._success = null;
    this._response = null;
    this._progressEvent = null;
    this._request = null;
    this._numRetries = 0;
    this._aborted = false;
}
FileUpload.prototype.getName = function() {
    return this._name;
};
FileUpload.prototype.getFile = function() {
    return this._file;
};
FileUpload.prototype.setFile = function(file) {
    this._file = file;
};
FileUpload.prototype.getData = function() {
    return this._data;
};
FileUpload.prototype.isComplete = function() {
    return this._success !== null;
};
FileUpload.prototype.isSuccess = function() {
    return this._success === true;
};
FileUpload.prototype.getResponse = function() {
    return this._response;
};
FileUpload.prototype.getProgressEvent = function() {
    return this._progressEvent;
};
FileUpload.prototype.setAsyncRequest = function(request) {
    this._request = request;
    return this;
};
FileUpload.prototype.increaseRetryCount = function() {
    this._numRetries++;
    return this;
};
FileUpload.prototype.getRetryCount = function() {
    return this._numRetries;
};
FileUpload.prototype.isWaiting = function() {
    return !this._request;
};
FileUpload.prototype.isAborted = function() {
    return this._aborted;
};
FileUpload.prototype.abort = function() {
    this._request = null;
    this._aborted = true;
};
FileUpload.prototype.handleSuccess = function(response) {
    this._success = true;
    this._response = response;
    this._progressEvent = null;
    return this;
};
FileUpload.prototype.handleFailure = function(response) {
    this._success = false;
    this._response = response;
    this._progressEvent = null;
    return this;
};
FileUpload.prototype.handleProgress = function(event) {
    this._progressEvent = event;
    return this;
};
module.exports = AsyncUploadBase;