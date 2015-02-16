/**
 * @providesModule AsyncUploadRequest
 */
var AsyncUploadBase = require('./AsyncUploadBase');

for (var h in AsyncUploadBase) {
    if (AsyncUploadBase.hasOwnProperty(h)) {
        AsyncUploadRequest[h] = AsyncUploadBase[h];
    }
}
var protoAsyncUploadBase = AsyncUploadBase === null ? null : AsyncUploadBase.prototype;
AsyncUploadRequest.prototype = Object.create(protoAsyncUploadBase);
AsyncUploadRequest.prototype.constructor = AsyncUploadRequest;
AsyncUploadRequest.__superConstructor__ = AsyncUploadBase;

function AsyncUploadRequest() {
    if (AsyncUploadBase !== null) {
        AsyncUploadBase.apply(this, arguments);
    }
}
AsyncUploadRequest.prototype.setFiles = function(files) {
    this._files = AsyncUploadBase.parseFiles(files);
    return this;
};
AsyncUploadRequest.prototype.abort = function() {
    /**
     * this._uploads[] --> array of AsyncUploadBase::FileUpload instances
     */
    this._uploads.forEach(function(fileUpload) {
        return this._abort(fileUpload);
    }.bind(this), this);
};
AsyncUploadRequest.prototype.send = function() {
    if (this._inFlight) {
        return;
    }
    this._inFlight = true;
    this._uploads = [];
    for (var name in this._files) {
        this._files[name].forEach(function(file) {
            this._uploads.push(this._createFileUpload(name, file));
        }.bind(this));
    }
    /**
     * this._waiting[] --> array of AsyncUploadBase::FileUpload instances
     */
    this._waiting = this._uploads.slice(0);
    this._pending = [];
    if (this._uploads.length) {
        this._processQueue();
    } else {
        this._processUpload(this._createFileUpload(null, null));
    }
};
AsyncUploadRequest.prototype._processQueue = function() {
    protoAsyncUploadBase._processQueue.call(this);
    if (!this._pending.length && !this._waiting.length) {
        this.inform('complete', this._uploads);
    }
};
AsyncUploadRequest.isSupported = function() {
    return AsyncUploadBase.isSupported();
};
module.exports = AsyncUploadRequest;