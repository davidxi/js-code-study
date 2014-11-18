/**
 * providesModule UserAgent_DEPRECATED
 */
var memoized = false;
// variables to store memoized result
var _ie,
    _firefox,
    _opera,
    _webkit,
    _chrome,
    _ieRealVersion,
    _osx,
    _windows,
    _linux,
    _android,
    _win64,
    _iphone,
    _ipad,
    _nativeApp,
    _otherMobile;

function detectUserAgent() {
    if (memoized) return;
    memoized = true;
    var userAgent = navigator.userAgent;

    var matchedIE = /(?:MSIE.(\d+\.\d+))|(?:(?:Firefox|GranParadiso|Iceweasel).(\d+\.\d+))|(?:Opera(?:.+Version.|.)(\d+\.\d+))|(?:AppleWebKit.(\d+(?:\.\d+)?))|(?:Trident\/\d+\.\d+.*rv:(\d+\.\d+))/.exec(userAgent);

    var matchedOS = /(Mac OS X)|(Windows)|(Linux)/.exec(userAgent);

    _iphone = /\b(iPhone|iP[ao]d)/.exec(userAgent);
    _ipad = /\b(iP[ao]d)/.exec(userAgent);
    _android = /Android/i.exec(userAgent);
    _nativeApp = /FBAN\/\w+;/i.exec(userAgent);
    _otherMobile = /Mobile/i.exec(userAgent);
    _win64 = !!(/Win64/.exec(userAgent));

    if (matchedIE) {
        _ie = matchedIE[1] ? parseFloat(matchedIE[1]) : (matchedIE[5] ? parseFloat(matchedIE[5]) : NaN);
        if (_ie && document && document.documentMode) {
            _ie = document.documentMode;
        }
        var ba = /(?:Trident\/(\d+.\d+))/.exec(userAgent);
        _ieRealVersion = ba ? parseFloat(ba[1]) + 4 : _ie;
        _firefox = matchedIE[2] ? parseFloat(matchedIE[2]) : NaN;
        _opera = matchedIE[3] ? parseFloat(matchedIE[3]) : NaN;
        _webkit = matchedIE[4] ? parseFloat(matchedIE[4]) : NaN;
        if (_webkit) {
            z = /(?:Chrome\/(\d+\.\d+))/.exec(userAgent);
            _chrome = z && matchedIE[1] ? parseFloat(matchedIE[1]) : NaN;
        } else {
            _chrome = NaN;
        }
    } else {
        _ie = _firefox = _opera = _chrome = _webkit = NaN;
    }

    if (matchedOS) {
        if (matchedOS[1]) {
            var ca = /(?:Mac OS X (\d+(?:[._]\d+)?))/.exec(userAgent);
            _osx = ca ? parseFloat(ca[1].replace('_', '.')) : true;
        } else {
            _osx = false;
        }
        _windows = !!matchedOS[2];
        _linux  = !!matchedOS[3];
    } else {
        _osx = _windows = _linux  = false;
    }
}

var UserAgent = {
    ie: function() {
        return detectUserAgent() || _ie;
    },
    ieCompatibilityMode: function() {
        return detectUserAgent() || (_ieRealVersion > _ie);
    },
    ie64: function() {
        return UserAgent.ie() && _win64;
    },
    firefox: function() {
        return detectUserAgent() || _firefox;
    },
    opera: function() {
        return detectUserAgent() || _opera;
    },
    webkit: function() {
        return detectUserAgent() || _webkit;
    },
    safari: function() {
        return UserAgent.webkit();
    },
    chrome: function() {
        return detectUserAgent() || _chrome;
    },
    windows: function() {
        return detectUserAgent() || _windows;
    },
    osx: function() {
        return detectUserAgent() || _osx;
    },
    linux: function() {
        return detectUserAgent() || _linux;
    },
    iphone: function() {
        return detectUserAgent() || _iphone;
    },
    mobile: function() {
        return detectUserAgent() || (_iphone || _ipad || _android || _otherMobile);
    },
    nativeApp: function() {
        return detectUserAgent() || _nativeApp;
    },
    android: function() {
        return detectUserAgent() || _android;
    },
    ipad: function() {
        return detectUserAgent() || _ipad;
    }
};
module.exports = UserAgent;