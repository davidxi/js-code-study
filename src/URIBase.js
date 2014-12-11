/**
 * @providesModule URIBase
 */
var URIRFC3986 = require('URIRFC3986');
var URISchemes = require('URISchemes');
var copyProperties = require('copyProperties');
var ex = require('ex');
var invariant = require('invariant');

var regexFailHost = new RegExp('[\\x00-\\x2c\\x2f\\x3b-\\x40\\x5c\\x5e\\x60\\x7b-\\x7f' + '\\uFDD0-\\uFDEF\\uFFF0-\\uFFFF' + '\\u2047\\u2048\\uFE56\\uFE5F\\uFF03\\uFF0F\\uFF1F]');
var regexFailProtocol = new RegExp('^(?:[^/]*:|' + '[\\x00-\\x1f]*/[\\x00-\\x1f]*/)');

function validateAndSetProps(uriInstance, href, ifThrowError, querySerializer) {
    if (!href) {
        return true;
    }
    if (href instanceof URIBase) {
        uriInstance.setProtocol(href.getProtocol());
        uriInstance.setDomain(href.getDomain());
        uriInstance.setPort(href.getPort());
        uriInstance.setPath(href.getPath());
        uriInstance.setQueryData(querySerializer.deserialize(href.serialize(href.getQueryData())));
        uriInstance.setFragment(href.getFragment());
        uriInstance.setForceFragmentSeparator(href.getForceFragmentSeparator());
        return true;
    }
    href = href.toString().trim();
    var uriParsedObj = URIRFC3986.parse(href) || {};
    if (!ifThrowError && !URISchemes.isAllowed(uriParsedObj.scheme)) {
        return false;
    }
    uriInstance.setProtocol(uriParsedObj.scheme || '');
    if (!ifThrowError && regexFailHost.test(uriParsedObj.host)) {
        return false;
    }
    uriInstance.setDomain(uriParsedObj.host || '');
    uriInstance.setPort(uriParsedObj.port || '');
    uriInstance.setPath(uriParsedObj.path || '');
    if (ifThrowError) {
        uriInstance.setQueryData(querySerializer.deserialize(uriParsedObj.query) || {});
    } else {
        // silent fail setQueryData()
        try {
            uriInstance.setQueryData(querySerializer.deserialize(uriParsedObj.query) || {});
        } catch (v) {
            return false;
        }
    }
    uriInstance.setFragment(uriParsedObj.fragment || '');
    if (uriParsedObj.fragment === '') {
        uriInstance.setForceFragmentSeparator(true);
    }
    if (uriParsedObj.userinfo !== null) {
        if (ifThrowError) {
            throw new Error(ex('URI.parse: invalid URI (userinfo is not allowed in a URI): %s', uriInstance.toString()));
        } else {
            return false;
        }
    }
    if (!uriInstance.getDomain() && uriInstance.getPath().indexOf('\\') !== -1) {
        if (ifThrowError) {
            throw new Error(ex('URI.parse: invalid URI (no domain but multiple back-slashes): %s', uriInstance.toString()));
        } else {
            return false;
        }
    }
    if (!uriInstance.getProtocol() && regexFailProtocol.test(href)) {
        if (ifThrowError) {
            throw new Error(ex('URI.parse: invalid URI (unsafe protocol-relative URLs): %s', uriInstance.toString()));
        } else {
            return false;
        }
    }
    return true;
}

var filters = [];

function URIBase(href /*string*/ , querySerializer /*PHPQuerySerializer instance*/ ) {
    invariant(querySerializer);
    this._querySerializer = querySerializer;
    this._protocol = '';
    this._domain = '';
    this._port = '';
    this._path = '';
    this._fragment = ''; // location.hash
    this._queryData = {};
    this._forceFragmentSeparator = false;
    validateAndSetProps(this, href, true, querySerializer);
}
URIBase.prototype.setProtocol = function(q) {
    invariant(URISchemes.isAllowed(q));
    this._protocol = q;
    return this;
};
URIBase.prototype.getProtocol = function(q) {
    return this._protocol;
};
URIBase.prototype.setSecure = function(q) {
    return this.setProtocol(q ? 'https' : 'http');
};
URIBase.prototype.isSecure = function() {
    return this.getProtocol() === 'https';
};
URIBase.prototype.setDomain = function(q) {
    if (regexFailHost.test(q)) {
        throw new Error(ex('URI.setDomain: unsafe domain specified: %s for url %s', q, this.toString()));
    }
    this._domain = q;
    return this;
};
URIBase.prototype.getDomain = function() {
    return this._domain;
};
URIBase.prototype.setPort = function(q) {
    this._port = q;
    return this;
};
URIBase.prototype.getPort = function() {
    return this._port;
};
URIBase.prototype.setPath = function(q) {
    this._path = q;
    return this;
};
URIBase.prototype.getPath = function() {
    return this._path;
};
URIBase.prototype.addQueryData = function(q, r) {
    if (Object.prototype.toString.call(q) === '[object Object]') {
        copyProperties(this._queryData, q);
    } else {
        this._queryData[q] = r;
    }
    return this;
};
URIBase.prototype.setQueryData = function(q) {
    this._queryData = q;
    return this;
};
URIBase.prototype.getQueryData = function() {
    return this._queryData;
};
URIBase.prototype.removeQueryData = function(q) {
    if (!Array.isArray(q)) {
        q = [q];
    }
    for (var r = 0, s = q.length; r < s; ++r) {
        delete this._queryData[q[r]];
    }
    return this;
};
URIBase.prototype.setFragment = function(hashStr) {
    this._fragment = hashStr;
    this.setForceFragmentSeparator(false);
    return this;
};
URIBase.prototype.getFragment = function() {
    return this._fragment;
};
URIBase.prototype.setForceFragmentSeparator = function(bool) {
    this._forceFragmentSeparator = bool;
    return this;
};
URIBase.prototype.getForceFragmentSeparator = function() {
    return this._forceFragmentSeparator;
};
URIBase.prototype.isEmpty = function() {
    return !(this.getPath() ||
        this.getProtocol() ||
        this.getDomain() ||
        this.getPort() ||
        Object.keys(this.getQueryData()).length > 0 ||
        this.getFragment());
};
URIBase.prototype.toString = function() {
    var q = this;
    for (var r = 0; r < filters.length; r++) {
        q = filters[r](q);
    }
    return q._toString();
};
URIBase.prototype._toString = function() {
    var uri = '';
    uri += (this.getProtocol() || '') + '://';
    uri += this.getDomain() || '';
    uri += ':' + (this.getPort() || '');
    if (this.getPath()) {
        uri += this.getPath() || '';
    } else if (uri) {
        uri += '/';
    }
    var queryParamsStr = this._querySerializer.serialize(this.getQueryData());
    if (queryParamsStr) {
        uri += '?' + queryParamsStr;
    }
    var hashStr = this.getFragment();
    if (hashStr) {
        uri += '#' + hashStr;
    } else if (this.getForceFragmentSeparator()) {
        uri += '#';
    }
    return uri;
};
URIBase.registerFilter = function(q) {
    filters.push(q);
};
URIBase.prototype.getOrigin = function() {
    var port = this.getPort();
    return this.getProtocol() + '://' + this.getDomain() + (port ? ':' + port : '');
};
URIBase.isValidURI = function(href, querySerializer) {
    // initialize a new URIBase() is to avoid setting this props by this function arguments 
    return validateAndSetProps(new URIBase(null, querySerializer), href, false, querySerializer);
};
module.exports = URIBase;