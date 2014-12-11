/**
 * @providesModule BigPipe
 */
var Arbiter = require('Arbiter');
var Bootloader = require('Bootloader');
var Env = require('Env');
var ErrorUtils = require('ErrorUtils');
var JSCC = require('JSCC');
var OnloadEvent = require('OnloadEvent');
var PageletSet = require('PageletSet');
var Run = require('Run');
var ServerJS = require('ServerJS');
var TimingSeriesStorage = require('TimingSeriesStorage');
var $ = require('$');
var copyProperties = require('copyProperties');
var ge = require('ge');
var invokeCallbacks = require('invokeCallbacks');
var ix = require('ix');
var performanceAbsoluteNow = require('performanceAbsoluteNow');

var ieVersion = document.documentMode || +(/MSIE.(\d+)/.exec(navigator.userAgent) || [])[1];

var PAGELET_EVENT_MAP = {
    display_start: 'displayStart',
    display: 'display',
    jsstart: 'jsStart',
    jsdone: 'jsDone',
    preonload: 'preOnLoad',
    onload: 'onLoad',
    css: 'css',
    css_load: 'cssLoad',
    arrive: 'arrive',
    setup: 'setup'
};

// outside code call:
//
// new (require("BigPipe"))({"lid":0,"forceFinish":true});

function BigPipe(opts) {
    copyProperties(this, {
        arbiter: Arbiter,
        rootNodeID: 'content',
        lid: 0,
        isAjax: false,
        domContentCallback: Run.__domContentCallback,
        onloadCallback: Run.__onloadCallback,
        domContentEvt: OnloadEvent.ONLOAD_DOMCONTENT_CALLBACK,
        onloadEvt: OnloadEvent.ONLOAD_CALLBACK,
        forceFinish: false,
        _phaseDoneCallbacks: [],
        _currentPhase: 0,
        _lastPhase: -1,
        _livePagelets: {},
        _pendingTimingSeries: {}
    });
    copyProperties(this, opts);
    if (this.automatic) {
        this._relevant_instance = BigPipe._current_instance;
    } else {
        BigPipe._current_instance = this;
    }
    this._serverJS = new ServerJS();
    Arbiter.inform('BigPipe/init', {
        lid: this.lid,
        arbiter: this.arbiter
    }, Arbiter.BEHAVIOR_PERSISTENT);

    // block DOM:ready until pagelet all displayed
    this.arbiter.registerCallback(this.domContentCallback, ['pagelet_displayed_all']);

    // broadcast init phase started
    this._informEventExternal('phase_begin', {
        phase: 0
    });
    this.arbiter.inform('phase_begin_0', true, Arbiter.BEHAVIOR_STATE);

    // block window:onload until pagelet all displayed
    this.onloadCallback = this.arbiter.registerCallback(this.onloadCallback, ['pagelet_displayed_all']);

    this.arbiter.registerCallback(this._serverJS.cleanup.bind(this._serverJS), [this.onloadEvt]);
}
BigPipe.prototype._beginPhase = function(phaseNumber) {
    this._informEventExternal('phase_begin', {
        phase: phaseNumber
    });
    this.arbiter.inform('phase_begin_' + phaseNumber, true, Arbiter.BEHAVIOR_STATE);
};
BigPipe.prototype._endPhase = function(phaseNumber) {
    this.arbiter.inform('phase_complete_' + phaseNumber, true, Arbiter.BEHAVIOR_STATE);
};
BigPipe.prototype._displayPageletHandler = function(pageletData) {
    if (this.displayCallback) {
        this.displayCallback(this._displayPagelet.bind(this, pageletData));
    } else {
        this._displayPagelet(pageletData);
    }
};
BigPipe.prototype._displayPagelet = function(pageletData) {
    this._informPageletEvent('display_start', pageletData);

    var rootPagelet = this._getPagelet(pageletData);
    for (var contentPageletId in pageletData.content) {

        var contentPagelet = pageletData.content[contentPageletId];
        if (pageletData.append) {
            contentPageletId = this._getPageletRootID(pageletData);
        }
        var contentPageletNode = ge(contentPageletId);
        if (!contentPageletNode) {
            continue;
        }
        if (contentPageletId === rootPagelet.id) {
            rootPagelet.setRoot(contentPageletNode);
        }

        contentPagelet = getContentFromPagelet(contentPagelet);
        if (contentPagelet) {
            if (pageletData.append || ieVersion < 8) {
                if (!pageletData.append) {
                    // clear up `contentPageletNode` content
                    while (contentPageletNode.firstChild) {
                        contentPageletNode.removeChild(contentPageletNode.firstChild);
                    }
                }
                setMarkupOnNode(contentPageletNode, contentPagelet);
            } else {
                contentPageletNode.innerHTML = contentPagelet;
            }
        }

        if (!contentPageletNode.getAttribute('data-referrer')) {
            contentPageletNode.setAttribute('data-referrer', contentPageletId);
        }
        if (pageletData.cache_hit && Env.pc_debug) {
            contentPageletNode.style.border = '1px red solid';
        }
    }

    if (pageletData.jsmods) {
        var jsmodsData = JSON.parse(JSON.stringify(pageletData.jsmods));
        var serverJsHanlder = this._serverJS.handlePartial(jsmodsData);
        rootPagelet.addDestructor(serverJsHanlder.cancel.bind(serverJsHanlder));
    }

    this._informPageletEvent('display', pageletData);
    this.arbiter.inform(pageletData.id + '_displayed', true, Arbiter.BEHAVIOR_STATE);
};
BigPipe.prototype._onPhaseDone = function() {
    if (this._currentPhase === this._ttiPhase) {
        this._informEventExternal('tti_bigpipe', {
            phase: this._ttiPhase
        });
    }
    if (this._currentPhase === this._lastPhase && this._isRelevant()) {
        this.arbiter.inform('pagelet_displayed_all', true, Arbiter.BEHAVIOR_STATE);
    }
    this._currentPhase++;
    if (ieVersion <= 8) {
        setTimeout(this._beginPhase.bind(this, this._currentPhase), 20);
    } else {
        this._beginPhase(this._currentPhase);
    }
};
BigPipe.prototype._downloadJsForPagelet = function(pageletData) {
    this._informPageletEvent('jsstart', pageletData);
    Bootloader.loadResources(pageletData.js || [], function() {
        this._informPageletEvent('jsdone', pageletData);
        pageletData.requires = pageletData.requires || [];
        if (!this.isAjax || pageletData.phase >= 1) {
            pageletData.requires.push('uipage_onload');
        }
        var cbOnload = function() {
            this._informPageletEvent('preonload', pageletData);
            if (this._isRelevantPagelet(pageletData)) {
                invokeCallbacks(pageletData.onload);
            }
            this._informPageletEvent('onload', pageletData);
            this.arbiter.inform('pagelet_onload', true, Arbiter.BEHAVIOR_EVENT);
            pageletData.provides && this.arbiter.inform(pageletData.provides, true, Arbiter.BEHAVIOR_STATE);
        }.bind(this);
        var cbOnWindowLoad = function() {
            this._isRelevantPagelet(pageletData) && invokeCallbacks(pageletData.onafterload);
        }.bind(this);

        this.arbiter.registerCallback(cbOnload, pageletData.requires);
        this.arbiter.registerCallback(cbOnWindowLoad, [this.onloadEvt]);
    }.bind(this), false, pageletData.id);
};
BigPipe.prototype._getPagelet = function(pageletData) {
    var rootPageletId = this._getPageletRootID(pageletData);
    return PageletSet.getPagelet(rootPageletId);
};
BigPipe.prototype._getPageletRootID = function(pageletData) {
    var appendToNode = pageletData.append;
    if (appendToNode) {
        return (appendToNode === 'bigpipe_root') ?
            this.rootNodeID :
            appendToNode;
    }
    return Object.keys(pageletData.content)[0] || null;
};
BigPipe.prototype._isRelevant = function() {
    return this == BigPipe._current_instance ||
        (this.automatic && this._relevant_instance == BigPipe._current_instance) ||
        this.jsNonBlock ||
        this.forceFinish ||
        (BigPipe._current_instance && BigPipe._current_instance.allowIrrelevantRequests);
};
BigPipe.prototype._isRelevantPagelet = function(ea) {
    if (!this._isRelevant())
        return false;
    var fa = this._getPageletRootID(ea);
    return !!this._livePagelets[fa];
};
BigPipe.prototype._informEventExternal = function(eventType, memo) {
    memo = memo || {};
    var pageletId = memo.id;
    var pageletEvent = memo.event;
    memo.ts = performanceAbsoluteNow();
    memo.lid = this.lid;
    console.timeStamp && console.timeStamp(eventType + " " + JSON.stringify(memo));
    if (eventType === 'pagelet_event') {
        if (pageletEvent === 'arrive') {
            this._pendingTimingSeries[pageletId] = TimingSeriesStorage.createSeries(pageletId, 'pagelet');
        }
        this._pendingTimingSeries[pageletId].mark(PAGELET_EVENT_MAP[pageletEvent], memo.ts);
        if (pageletEvent === 'onload') {
            this._pendingTimingSeries[pageletId].complete();
            delete this._pendingTimingSeries[pageletId];
        }
    }
    this.arbiter.inform(eventType, memo, Arbiter.BEHAVIOR_PERSISTENT);
};
BigPipe.prototype._informPageletEvent = function(pageletEventType, pageletData) {
    /**
     * example of `pageletConfig`
     * "{"id":"first_response","phase":0,"jsmods":{},"is_last":true,"css":["v9Z6h","Yke0t","HgIa3","HDTH6"],"js":["2kAe+","D0r9B","MBP/U","kF9oU","HBCEY","AWb/8","Loy8z","85t/8","0o6cu","4vv8/"],"displayJS":["MBP/U"]}"
     */
    var memo = {
        event: pageletEventType,
        id: pageletData.id
    };
    if (pageletData.phase) {
        memo.phase = pageletData.phase;
    }
    if (pageletData.categories) {
        memo.categories = pageletData.categories;
    }
    this._informEventExternal('pagelet_event', memo);
};
BigPipe.getCurrentInstance = function() {
    return BigPipe._current_instance;
};

// use onPageletArrive() after markups received:
// 
// bigPipe.onPageletArrive({"content":{"pagelet_welcome_box":{"container_id":"u_0_o"}},"jsmods":{"require":[["AsyncRequestNectarLogging"]]},"css":["hfx68","Yke0t","HDTH6"],"js":["MBP\/U","D0r9B","st9+4"],"id":"pagelet_welcome_box","phase":1,"categories":["left_column"]})
copyProperties(BigPipe.prototype, {
    onPageletArrive: ErrorUtils.guard(function(pageletData) {
        this._informPageletEvent('arrive', pageletData);
        pageletData.content = pageletData.content || {};

        var currentPhase = pageletData.phase;
        this._pendingTimingSeries[pageletData.id].addProperty('phase', currentPhase);
        if (!this._phaseDoneCallbacks[currentPhase])
            this._phaseDoneCallbacks[currentPhase] = this.arbiter.registerCallback(this._onPhaseDone.bind(this), ['phase_complete_' + currentPhase]);
        this.arbiter.registerCallback(this._phaseDoneCallbacks[currentPhase], [pageletData.id + '_displayed']);

        var rootPageletId = this._getPageletRootID(pageletData);
        var rootPagelet = PageletSet.getOrCreatePagelet(rootPageletId);
        if (rootPageletId) {
            this._pendingTimingSeries[pageletData.id].addProperty('rootID', rootPageletId);
        }
        if (pageletData.the_end) {
            this._lastPhase = currentPhase;
        }
        if (pageletData.tti_phase !== (void 0)) {
            this._ttiPhase = pageletData.tti_phase;
        }
        if (pageletData.is_second_to_last_phase) {
            this._secondToLastPhase = currentPhase;
        }
        this._livePagelets[rootPagelet.id] = true;
        rootPagelet.addDestructor(function() {
            delete this._livePagelets[rootPagelet.id];
        }.bind(this));

        if (pageletData.jscc_map) {
            var initFn;
            initFn = (eval)(pageletData.jscc_map);
            var resetFn = JSCC.init(initFn);
            rootPagelet.addDestructor(resetFn);
        }
        if (pageletData.resource_map) {
            Bootloader.setResourceMap(pageletData.resource_map);
        }
        if (pageletData.bootloadable) {
            Bootloader.enableBootload(pageletData.bootloadable);
        }

        ix.add(pageletData.ixData);

        this._informPageletEvent('setup', pageletData);
        var pageletArbiter = new Arbiter();
        pageletArbiter.registerCallback(this._displayPageletHandler.bind(this, pageletData), ['preceding_pagelets_displayed', 'display_resources_downloaded']);

        var depsPageletIds = pageletData.display_dependency || [];
        var depsPageletDisplayedEvents = depsPageletIds.map(function(oa) {
                return oa + '_displayed';
            });
        this.arbiter.registerCallback(function() {
            pageletArbiter.inform('preceding_pagelets_displayed');
        }, depsPageletDisplayedEvents);

        this.arbiter.registerCallback(function() {
            this._informPageletEvent('css', pageletData);
            var resourceIds = (pageletData.css || []).concat(pageletData.displayJS || []);
            Bootloader.loadResources(resourceIds, function() {
                this._informPageletEvent('css_load', pageletData);
                pageletArbiter.inform('display_resources_downloaded');
            }.bind(this), false, pageletData.id);
        }.bind(this), ['phase_begin_' + currentPhase]);

        this.arbiter.registerCallback(this.onloadCallback, ['pagelet_onload']);
        var selfDisplayedEvents = [pageletData.id + '_displayed'];

        if (!this.jsNonBlock) {
            selfDisplayedEvents.push(this.domContentEvt);
        }
        this.arbiter.registerCallback(this._downloadJsForPagelet.bind(this, pageletData), selfDisplayedEvents);
        if (pageletData.is_last) {
            this._endPhase(currentPhase);
        }
    }, 'BigPipe#onPageletArrive')
});

function getContentFromPagelet(pagelet /*instance*/ ) {
    if (!pagelet || typeof pagelet === 'string') {
        return pagelet;
    }
    if (pagelet.container_id) {
        var pageletContentNode = $(pagelet.container_id);
        pagelet = getMarkupFromCommentNode(pageletContentNode) || '';
        pageletContentNode.parentNode.removeChild(pageletContentNode);
        return pagelet;
    }
    return null;
}

function getMarkupFromCommentNode(markupNode /*element*/ ) {
    if (!markupNode.firstChild) {
        Bootloader.loadModules(["ErrorSignal"], function(ga) {
            ga.sendErrorSignal('bigpipe', 'Pagelet markup container is empty.');
        });
        return null;
    }
    if (markupNode.firstChild.nodeType !== 8) { // not a comment node
        return null;
    }
    var fa = markupNode.firstChild.nodeValue;
    fa = fa.substring(1, fa.length - 1);
    return fa.replace(/\\([\s\S]|$)/g, '$1');
}

function setMarkupOnNode(node, markup) {
    var tempRootNode = document.createElement('div');
    if (ieVersion < 7) {
        node.appendChild(tempRootNode);
    }

    // for ie < 7
    tempRootNode.innerHTML = markup;
    // for ie >= 7
    var tempFragment = document.createDocumentFragment();
    while (tempRootNode.firstChild) {
        tempFragment.appendChild(tempRootNode.firstChild);
    }
    node.appendChild(tempFragment);

    if (ieVersion < 7) {
        node.removeChild(tempRootNode);
    }
}

module.exports = BigPipe;