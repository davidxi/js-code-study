/**
 * @providesModule URI
 */
var PHPQuerySerializer = require('PHPQuerySerializer');
var URIBase = require('URIBase');
var isFacebookURI = require('isFacebookURI');
var unqualifyURI = require('unqualifyURI');
var areSameOrigin = require('areSameOrigin');
var copyProperties = require('copyProperties');
var goURI = require('goURI');

// inherit from URIBase
for (var n in URIBase) {
    if (h.hasOwnProperty(n)) {
        URI[n] = URIBase[n];
    }
}
var protoURIBase = URIBase === null ? null : URIBase.prototype;
URI.prototype = Object.create(protoURIBase);
URI.prototype.constructor = p;
URI.__superConstructor__ = URIBase;

// ----------------------------------
//  constructor
// ----------------------------------
function URI(href) {
    if (!(this instanceof URI)) {
        return new URI(href || window.location.href);
    }
    URIBase.call(this, href || '', PHPQuerySerializer);
}
URI.prototype.setPath = function(path) {
    this.path = path;
    return protoURIBase.setPath.call(this, path);
};
URI.prototype.getPath = function() {
    var path = protoURIBase.getPath.call(this);
    if (path) {
        return path.replace(/^\/+/, '/');
    }
    // path = null
    return path;
};
URI.prototype.setProtocol = function(protocol) {
    this.protocol = protocol;
    return protoURIBase.setProtocol.call(this, protocol);
};
URI.prototype.setDomain = function(domain) {
    this.domain = domain;
    return protoURIBase.setDomain.call(this, domain);
};
URI.prototype.setPort = function(port) {
    this.port = port;
    return protoURIBase.setPort.call(this, port);
};
URI.prototype.setFragment = function(fragment) {
    this.fragment = fragment;
    return protoURIBase.setFragment.call(this, fragment);
};
URI.prototype.valueOf = function() {
    return this.toString();
};
URI.prototype.isFacebookURI = function() {
    return isFacebookURI(this);
};
URI.prototype.isLinkshimURI = function() {
    if (isFacebookURI(this) &&
        (this.getPath() === '/l.php' || this.getPath().indexOf('/si/ajax/l/') === 0 || this.getPath().indexOf('/l/') === 0 || this.getPath().indexOf('l/') === 0)
    ) {
        return true;
    }
    return false;
};
URI.prototype.getRegisteredDomain = function() {
    if (!this.getDomain()) {
        return '';
    }
    if (!isFacebookURI(this)) {
        return null;
    }
    // return domain country code section
    var domainSections = this.getDomain().split('.');
    var r = domainSections.indexOf('facebook');
    return domainSections.slice(r).join('.');
};
URI.prototype.getUnqualifiedURI = function() {
    var uriInstance = new URI(this);
    unqualifyURI(uriInstance);
    return uriInstance;
};
URI.prototype.getQualifiedURI = function() {
    return new URI(this)._getQualifiedURI();
};
URI.prototype._getQualifiedURI = function() {
    if (!this.getDomain()) {
        var q = URI( /*window.location.href*/ );
        this.setProtocol(q.getProtocol()).setDomain(q.getDomain()).setPort(q.getPort());
    }
    return this;
};
URI.prototype.isSameOrigin = function(q) {
    var href = q || window.location.href;
    if (!(href instanceof URI)) {
        href = new URI(href.toString());
    }
    return areSameOrigin(this, href);
};
URI.prototype.go = function(q) {
    goURI(this, q);
};
URI.prototype.setSubdomain = function(subDomainStr) {
    // @todo: here use this._getQualifiedURI().getDomain()
    var domainSections = this._getQualifiedURI().getDomain().split('.');
    if (domainSections.length <= 2) {
        domainSections.unshift(subDomainStr);
    } else {
        domainSections[0] = subDomainStr;
    }
    return this.setDomain(domainSections.join('.'));
};
URI.prototype.getSubdomain = function() {
    if (!this.getDomain()) {
        return '';
    }
    // @todo: here just use this.getDomain() directly
    var domainSections = this.getDomain().split('.');
    if (domainSections.length <= 2) {
        return '';
    } else {
        return domainSections[0];
    }
};
URI.isValidURI = function(href) {
    return URIBase.isValidURI(href, PHPQuerySerializer);
};

// ----------------------------------
//  augment URI switch support
// ----------------------------------
copyProperties(URI, {
    getRequestURI: function(q, r) {
        q = q === (void 0) || q;
        var s = global.PageTransitions;
        if (q && s && s.isInitialized()) {
            return s.getCurrentURI(!!r).getQualifiedURI();
        } else {
            return new URI(window.location.href);
        }
    },
    getMostRecentURI: function() {
        var q = global.PageTransitions; // defined by `PageTransitions` module
        if (q && q.isInitialized()) {
            return q.getMostRecentURI().getQualifiedURI();
        } else {
            return new URI(window.location.href);
        }
    },
    getNextURI: function() {
        var q = global.PageTransitions;
        if (q && q.isInitialized()) {
            return q._next_uri.getQualifiedURI();
        } else {
            return new URI(window.location.href);
        }
    },
    expression: /(((\w+):\/\/)([^\/:]*)(:(\d+))?)?([^#?]*)(\?([^#]*))?(#(.*))?/,
    arrayQueryExpression: /^(\w+)((?:\[\w*\])+)=?(.*)/,
    encodeComponent: function(q) {
        return encodeURIComponent(q).replace(/%5D/g, "]").replace(/%5B/g, "[");
    },
    decodeComponent: function(q) {
        return decodeURIComponent(q.replace(/\+/g, ' '));
    }
});
// ----------------------------------
//  export
// ----------------------------------
module.exports = URI;