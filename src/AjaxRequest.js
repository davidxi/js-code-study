/**
 * @providesModule AjaxRequest
 */
var ErrorUtils = require('ErrorUtils');
var Keys = require('Keys');
var URI = require('URI');
var UserAgent_DEPRECATED = require('UserAgent_DEPRECATED');
var getSameOriginTransport = require('getSameOriginTransport');
var setTimeoutAcrossTransitions = require('setTimeoutAcrossTransitions');
var PHPQuerySerializer = require('PHPQuerySerializer');
var copyProperties = require('copyProperties');


function AjaxRequest(httpMethod, uri, params) {
    this.xhr = getSameOriginTransport();
    if (!(uri instanceof URI)) {
        uri = new URI(uri);
    }
    if (params && httpMethod == 'GET') {
        uri.setQueryData(params);
    } else {
        this._params = params;
    }
    this.method = httpMethod;
    this.uri = uri;
    this.xhr.open(httpMethod, uri);
}

AjaxRequest.supportsCORS = function() {
    return window.XMLHttpRequest &&
           ('withCredentials' in new XMLHttpRequest());
};

AjaxRequest.ERROR = 'ar:error';
AjaxRequest.TIMEOUT = 'ar:timeout';
AjaxRequest.PROXY_ERROR = 'ar:proxy error';
AjaxRequest.TRANSPORT_ERROR = 'ar:transport error';
AjaxRequest.SERVER_ERROR = 'ar:http error';
AjaxRequest.PARSE_ERROR = 'ar:parse error';
AjaxRequest._inflight = [];
// [{AjaxRequest instance 1}, {AjaxRequest instance 2}, ...]

function teardownInflights() {
    var inflight = AjaxRequest._inflight;
    AjaxRequest._inflight = [];
    inflight.forEach(function(ajaxRequest /*instance*/ ) {
        ajaxRequest.abort(); // AjaxRequest.abort() -> AjaxRequest.teardownConnetction(this)
    });
}

function teardownConnetction(ajaxRequest /*AjaxRequest instance*/ ) {

    ajaxRequest.onJSON = ajaxRequest.onError = ajaxRequest.onSuccess = null;

    clearTimeout(ajaxRequest._timer);

    if (ajaxRequest.xhr && ajaxRequest.xhr.readyState < 4) {
        ajaxRequest.xhr.abort();
        ajaxRequest.xhr = null;
    }

    AjaxRequest._inflight = AjaxRequest._inflight.filter(function(_inflightAjaxRequest) {
        return _inflightAjaxRequest &&
            _inflightAjaxRequest != ajaxRequest &&
            _inflightAjaxRequest.xhr &&
            _inflightAjaxRequest.xhr.readyState < 4;
    });
}

copyProperties(AjaxRequest.prototype, {
    timeout: 60000, // 1 min
    streamMode: true,
    prelude: /^for \(;;\);/,
    status: null,
    _eol: -1, // end-of-line (for parsing partial data)
    _call: function(method) {
        if (this[method]) {
            this[method](this);
        }
    },
    _parseStatus: function() {
        var statusText;
        try {
            this.status = this.xhr.status;
            statusText = this.xhr.statusText;
        } catch (err) {
            if (this.xhr.readyState >= 4) {
                this.errorType = AjaxRequest.TRANSPORT_ERROR;
                this.errorText = err.message;
            }
            return;
        }
        if (this.status === 0 && !(/^(file|ftp)/.test(this.uri))) {
            this.errorType = AjaxRequest.TRANSPORT_ERROR;
        } else if (this.status >= 100 && this.status < 200) {
            this.errorType = AjaxRequest.PROXY_ERROR;
        } else if (this.status >= 200 && this.status < 300) {
            return;
        } else if (this.status >= 300 && this.status < 400) {
            this.errorType = AjaxRequest.PROXY_ERROR;
        } else if (this.status >= 400 && this.status < 500) {
            this.errorType = AjaxRequest.SERVER_ERROR;
        } else if (this.status >= 500 && this.status < 600) {
            this.errorType = AjaxRequest.PROXY_ERROR;
        } else if (this.status == 1223) {
            return;
        } else if (this.status >= 12001 && this.status <= 12156) {
            this.errorType = AjaxRequest.TRANSPORT_ERROR;
        } else {
            statusText = 'unrecognized status code: ' + this.status;
            this.errorType = AjaxRequest.ERROR;
        }
        if (!this.errorText) {
            this.errorText = statusText;
        }
    },
    _parseResponse: function() {
        var responseText;
        var readyState = this.xhr.readyState;
        try {
            responseText = this.xhr.responseText || '';
        } catch (err) {
            if (readyState >= 4) {
                this.errorType = AjaxRequest.ERROR;
                this.errorText = 'responseText not available - ' + err.message;
            }
            return;
        }
        while (this.xhr) {
            var startPosition = this._eol + 1;
            var endPosition = this.streamMode ?
                responseText.indexOf('\n', startPosition) :
                responseText.length;

            if (endPosition < 0 && readyState == 4) {
                endPosition = responseText.length;
            }
            if (endPosition <= this._eol) {
                // `this._eol` marks the end position of processed text range
                break;
            }
            var textToProcess = responseText;
            if (this.streamMode) {
                textToProcess = responseText.substr(startPosition, endPosition - startPosition)
                    .replace(/^\s*|\s*$/g, ''); // trim whitespace
            }
            if (startPosition === 0 && this.prelude) {
                if (this.prelude.test(textToProcess)) {
                    textToProcess = textToProcess.replace(this.prelude, '');
                }
            }
            this._eol = endPosition;
            if (textToProcess) {
                try {
                    this.json = JSON.parse(textToProcess);
                } catch (err) {
                    var htmlBodyString = (/(<body[\S\s]+?<\/body>)/i).test(responseText) && RegExp.$1;
                    var jsonParseFailedError = {
                        message: err.message,
                        'char': startPosition,
                        excerpt: ((startPosition === 0 && htmlBodyString) || textToProcess).substr(512)
                    };
                    this.errorType = AjaxRequest.PARSE_ERROR;
                    this.errorText = 'parse error - ' + JSON.stringify(jsonParseFailedError);
                    return;
                }
                ErrorUtils.applyWithGuard(this._call, this, ['onJSON']);
            }
        }
    },
    _onReadyState: function() {
        var readyState = this.xhr && this.xhr.readyState || 0;
        // 2 HEADERS_RECEIVED send() has been called, and headers and status are available
        if (this.status == null && readyState >= 2) {
            this._parseStatus();
        }
        // 3 LOADING Downloading; responseText holds partial data.
        if (!this.errorType && this.status != null) {
            if ((readyState == 3 && this.streamMode) || readyState == 4) {
                this._parseResponse();
            }
        }

        // 4 DONE The operation is complete.
        if (this.errorType || readyState == 4) {
            this._time = Date.now() - this._sentAt;
            this._call(!this.errorType ? 'onSuccess' : 'onError');
            teardownConnetction(this);
        }
    },
    send: function(data) {
        this.xhr.onreadystatechange = function() {
            ErrorUtils.applyWithGuard(this._onReadyState, this, arguments);
        }.bind(this);
        if (this.timeout) {
            this._timer = setTimeoutAcrossTransitions((function() {
                this.errorType = AjaxRequest.TIMEOUT;
                this.errorText = 'timeout';
                this._time = Date.now() - this._sentAt;
                this._call('onError');
                teardownConnetction(this);
            }).bind(this), this.timeout);
        }
        AjaxRequest._inflight.push(this);
        if (this.method == 'POST') {
            this.xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        }
        this._sentAt = Date.now();
        this.xhr.send(data ? PHPQuerySerializer.serialize(data) : '');
    },
    abort: function() {
        teardownConnetction(this);
    },
    toString: function() {
        var s = 'AjaxRequest readyState=' + this.xhr.readyState;
        if (this.errorType) {
            s += ' errorType=' + this.errorType + ' (' + this.errorText + ')';
        }
        return '[' + s + ']';
    },
    toJSON: function() {
        var dumped = {
            json: this.json,
            status: this.status,
            errorType: this.errorType,
            errorText: this.errorText,
            time: this._time
        };
        if (this.errorType) {
            dumped.uri = this.uri;
        }
        for (var t in dumped) {
            if (dumped[t] == null) {
                delete dumped[t];
            }
        }
        return dumped;
    }
});

/**
 * Bug 647725 - Escape key cancels XmlHttpRequests too
 * https://bugzilla.mozilla.org/show_bug.cgi?id=647725
 */
if (window.addEventListener && UserAgent_DEPRECATED.firefox()) {
    window.addEventListener('keydown', function(event) {
        if (event.keyCode === Keys.ESC) {
            event.prevent();
        }
    }, false);
}

/**
 * There is a known bug in IE where inflight XHR requests are not
 * properly cleaned up when you leave a page. The workaround is
 * to set up an 'unload' event handler that aborts any
 * in-progress requests.
 */
if (window.attachEvent) {
    window.attachEvent('onunload', teardownInflights);
}

module.exports = AjaxRequest;