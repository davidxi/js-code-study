/**
 * @providesModule FileForm
 */
var ArbiterMixin = require('./ArbiterMixin');
var AsyncRequest = require('./AsyncRequest');
var AsyncResponse = require('./AsyncResponse');
var AsyncUploadRequest = require('./AsyncUploadRequest');
var BehaviorsMixin = require('./BehaviorsMixin');
var CurrentUser = require('./CurrentUser');
var DataStore = require('./DataStore');
var DOMQuery = require('./DOMQuery');
var Event = require('./Event');
var Form = require('./Form');
var JSONPTransport = require('./JSONPTransport');
var Parent = require('./Parent');
var URI = require('./URI');
var copyProperties = require('./copyProperties');
var mixin = require('./mixin');
var shield = require('./shield');

function getFilesFromInputs(formNode) {
    var allFiles = {};
    var fileInputs = DOMQuery.scry(formNode, 'input[type="file"]');
    fileInputs.forEach(function(fileInput) {
        allFiles[fileInput.name] = fileInput.files;
    });
    return allFiles;
}

function clearAllFileInputs(formNode) {
    var fileInputs = DOMQuery.scry(formNode, 'input[type="file"]');
    fileInputs.forEach(function(fileInput) {
        fileInput.files = null;
    });
}

var propsArbiterMixin = mixin(ArbiterMixin, BehaviorsMixin);
for (var z in propsArbiterMixin) {
    if (propsArbiterMixin.hasOwnProperty(z)) {
        FileForm[z] = propsArbiterMixin[z];
    }
}
var protoArbiterMixin = propsArbiterMixin === null ? null : propsArbiterMixin.prototype;
FileForm.prototype = Object.create(protoArbiterMixin);
FileForm.prototype.constructor = FileForm;
FileForm.__superConstructor__ = propsArbiterMixin;

function FileForm(formNode, da, options) {
    if (formNode.getAttribute('rel') === 'async') {
        throw new Error('FileForm cannot be used with Primer forms.');
    }
    if (formNode.getAttribute('method').toUpperCase() !== 'POST') {
        throw new Error('FileForm must be used with POST forms.');
    }
    this._form = formNode;
    this._previousEncoding = this._form.enctype;
    this._form.enctype = this._form.encoding = 'multipart/form-data';
    this._files = null;
    da && this.enableBehaviors(da);
    this._options = options || {};
    this.setAllowCrossOrigin(this._options.allowCrossOrigin);
    this.setAllowCrossPageTransition(this._options.allowCrossPageTransition);
    this.setUploadInParallel(this._options.uploadInParallel);
    this.setConcurrentLimit(this._options.concurrentLimit);
    this.setPreprocessHandler(this._options.preprocessHandler);
    this.setNetworkErrorRetryLimit(this._options.networkErrorRetryLimit);
    this._listeners = [
        Event.listen(this._form, 'submit', this._submit.bind(this)),
        Event.listen(this._form, 'click', this._click.bind(this))
    ];
    DataStore.set(this._form, 'FileForm', this);
}
FileForm.prototype.getRoot = function() {
    return this._form;
};
FileForm.prototype.setAllowCrossOrigin = function(allowCrossOrigin) {
    this._allowCrossOrigin = !!allowCrossOrigin;
    return this;
};
FileForm.prototype.setAllowCrossPageTransition = function(allowCrossPageTransition) {
    this._allowCrossPageTransition = !!allowCrossPageTransition;
    return this;
};
FileForm.prototype.setUploadInParallel = function(uploadInParallel) {
    this._uploadInParallel = !!uploadInParallel;
    return this;
};
FileForm.prototype.setConcurrentLimit = function(concurrentLimit) {
    this._concurrentLimit = concurrentLimit;
    return this;
};
FileForm.prototype.setPreprocessHandler = function(preprocessHandler) {
    this._preprocessHandler = preprocessHandler;
    return this;
};
FileForm.prototype.setNetworkErrorRetryLimit = function(networkErrorRetryLimit) {
    this._retryLimit = networkErrorRetryLimit;
    return this;
};
FileForm.prototype.setFiles = function(files) {
    this._files = files;
    return this;
};
FileForm.prototype.canUseXHR = function() {
    var canUseXHR = 'FormData' in window;
    if (canUseXHR) {
        if (!URI(this._form.action).isSameOrigin() && !this._allowCrossOrigin) {
            canUseXHR = false;
        }
    }
    return canUseXHR;
};
FileForm.prototype._submit = function(event) {
    if (this.inform('submit') === false) {
        event.prevent();
        return;
    }
    return this.canUseXHR() ? this._sendViaXHR(event) : this._sendViaFrame(event);
};
FileForm.prototype._click = function(event) {
    var ca = event.getTarget();
    while (DOMQuery.isElementNode(ca)) {
        if (ca.type === 'submit') {
            this._clickTarget = ca;
            setTimeout(this._unclick.bind(this), 0);
            break;
        }
        ca = ca.parentNode;
    }
};
FileForm.prototype._unclick = function() {
    this._clickTarget = null;
};
FileForm.prototype._sendViaFrame = function(event) {
    var request = new AsyncRequest();
    this._request = request;

    request.setStatusElement(this._getStatusElement());
    request.addStatusIndicator();
    request.setOption('useIframeTransport', true);

    var transport = new JSONPTransport('iframe', this._form.action, request.handleResponse.bind(request));
    var frame = transport.getTransportFrame();
    var uri = transport.getRequestURI().addQueryData({
        __iframe: true,
        __user: CurrentUser.getID()
    });
    this._form.setAttribute('action', uri.toString());
    this._form.setAttribute('target', frame.name);

    request.setJSONPTransport(transport);
    request.setURI(uri);
    request.setHandler(this.success.bind(this, null));
    request.setErrorHandler(this.failure.bind(this, null));
    request.setInitialHandler(shield(this.initial, this, null));
};
FileForm.prototype._sendViaXHR = function(event) {
    var uploadRequest;

    if (this._uploadInParallel && AsyncUploadRequest.isSupported()) {
        uploadRequest =
            new AsyncUploadRequest().
              setPreprocessHandler(this._preprocessHandler).
              setData(Form.serialize(this._form, this._clickTarget)).
              setNetworkErrorRetryLimit(this._retryLimit);

        if (this._concurrentLimit) {
            uploadRequest.setLimit(this._concurrentLimit);
        }
        if (this._files) {
            uploadRequest.setFiles(this._files);
        } else {
            uploadRequest.setFiles(getFilesFromInputs(this._form));
        }
        var uploadEvtsSubscriptions = [
            uploadRequest.subscribe('progress', function(evt, uploadRequest) {
                this.progress(uploadRequest, uploadRequest.getProgressEvent());
            }.bind(this)),
            uploadRequest.subscribe('initial', function(evt, uploadRequest) {
                this.initial(uploadRequest, uploadRequest.getResponse());
            }.bind(this)),
            uploadRequest.subscribe('success', function(evt, uploadRequest) {
                this.success(uploadRequest, uploadRequest.getResponse());
            }.bind(this)),
            uploadRequest.subscribe('start', function(evt, uploadRequest) {
                this.inform('start', { upload: uploadRequest });
            }.bind(this)),
            uploadRequest.subscribe('failure', function(evt, uploadRequest) {
                this.failure(uploadRequest, uploadRequest.getResponse());
                return false;
            }.bind(this)),
            uploadRequest.subscribe('complete', function() {
                while (uploadEvtsSubscriptions.length) {
                    uploadEvtsSubscriptions.pop().unsubscribe();
                } // @todo: use for loop to avoid O(N^2)
            })
        ];
        // ./ if (this._uploadInParallel && AsyncUploadRequest.isSupported())
    } else {
        var formData;
        if (this._files) {
            formData = Form.createFormData(Form.serialize(this._form, this._clickTarget));
            // static method inherited from AsyncUploadBase::parseFiles()
            var filesMap = AsyncUploadRequest.parseFiles(this._files);
            for (var fileInputName in filesMap) {
                var filesObjs = filesMap[fileInputName];
                if (filesObjs.length === 1) {
                    formData.append(fileInputName, filesObjs[0]);
                } else {
                    fileInputName = fileInputName + '[]';
                    filesObjs.forEach(function(fileObj) {
                        formData.append(fileInputName, fileObj);
                    });
                }
            }
        } else {
            formData = Form.createFormData(this._form, this._clickTarget);
        }
        uploadRequest =
            new AsyncRequest().
              setRawData(formData).
              setHandler(this.success.bind(this, null)).
              setErrorHandler(this.failure.bind(this, null)).
              setUploadProgressHandler(this.progress.bind(this, null)).
              setInitialHandler(shield(this.initial, this, null));
        // ./ if (!this._uploadInParallel || !AsyncUploadRequest.isSupported())
    }

    uploadRequest.
      setAllowCrossOrigin(this._allowCrossOrigin).
      setAllowCrossPageTransition(this._allowCrossPageTransition).
      setRelativeTo(this._form).
      setStatusElement(this._getStatusElement()).
      setURI(this._form.action).
      send();

    this._request = uploadRequest;
    event && event.prevent();
};
FileForm.prototype.forceSendViaXHR = function() {
    return this._sendViaXHR(null);
};
FileForm.prototype.initial = function(uploadRequest) {
    return this.inform('initial', {
        upload: uploadRequest
    });
};
FileForm.prototype.success = function(uploadRequest, response) {
    var memo = {
        response: response,
        upload: uploadRequest
    };
    if (this.inform('success', memo) !== false) {
        Event.fire(this._form, 'success', memo);
    }
    this._cleanup();
};
FileForm.prototype.failure = function(uploadRequest, response) {
    var memo = {
        response: response,
        upload: uploadRequest
    };
    if (this.inform('failure', memo) !== false) {
        if (Event.fire(this._form, 'error', memo) !== false) {
            AsyncResponse.defaultErrorHandler(response);
        }
    }
    this._cleanup();
};
FileForm.prototype.progress = function(uploadRequest, event) {
    this.inform('progress', {
        event: event,
        upload: uploadRequest
    });
};
FileForm.prototype.abort = function() {
    if (this._request) {
        this._request.abort();
        this._cleanup();
    }
};
FileForm.prototype.clear = function() {
    clearAllFileInputs(this._form);
};
FileForm.prototype.destroy = function() {
    this._cleanup();
    while (this._listeners.length) {
        this._listeners.pop().remove();
    }
    this._listeners = null;
    this._form.enctype = this._form.encoding = this._previousEncoding;
    DataStore.remove(this._form, 'FileForm');
};
FileForm.prototype._cleanup = function() {
    this._request = null;
};
FileForm.prototype._getStatusElement = function() {
    return Parent.byClass(this._form, 'stat_elem') || this._form;
};
FileForm.getInstance = function(formNode) {
    return DataStore.get(formNode, 'FileForm');
};
copyProperties(FileForm, {
    EVENTS: ['start', 'submit', 'initial', 'progress', 'success', 'failure']
});
module.exports = FileForm;