/**
 * @providesModule OnVisible
 */
var Arbiter = require('./Arbiter');
var DOM = require('./DOM');
var Event = require('./Event');
var Parent = require('./Parent');
var Run = require('./Run');
var Vector = require('./Vector');
var ViewportBounds = require('./ViewportBounds');
var coalesce = require('./coalesce');
var copyProperties = require('./copyProperties');
var queryThenMutateDOM = require('./queryThenMutateDOM');

var instances = [];
var instancesCount = 0;
var t = [];
var onDomScroll;
var onWinResize;
var onWinScroll;
var scrollOffsetTop;
var viewportHeight;
var viewportTop;

function teardown() {
    instances.forEach(function(instance) {
        instance.remove();
    });
    if (onWinScroll) {
        onWinScroll.remove();
        onWinResize.remove();
        onDomScroll.unsubscribe();
        onWinScroll = onWinResize = onDomScroll = null;
    }
    instancesCount = 0;
    instances.length = 0;
}

function queryDOM() {
    if (!instances.length) {
        teardown();
        return;
    }
    t.length = 0;
    scrollOffsetTop = Vector.getScrollPosition().y;
    viewportHeight = Vector.getViewportDimensions().y;
    viewportTop = ViewportBounds.getTop();
    for (var fa = 0; fa < instances.length; ++fa) {
        var instance = instances[fa];
        if (isNaN(instance.elementHeight)) {
            t.push(fa);
        }
        instance.elementHeight = Vector.getElementDimensions(instance.element).y;
        instance.elementPos = Vector.getElementPosition(instance.element);
        instance.hidden = Parent.byClass(instance.element, 'hidden_elem');
        if (instance.scrollArea) {
            instance.scrollAreaHeight = Vector.getElementDimensions(instance.scrollArea).y;
            instance.scrollAreaY = Vector.getElementPosition(instance.scrollArea).y;
        }
    }
    instancesCount = fa;
}

function mutateDOM() {
    for (var fa = Math.min(instances.length, instancesCount) - 1; fa >= 0; --fa) {
        var instance = instances[fa];
        if (!instance.elementPos || instance.removed) {
            instances.splice(fa, 1);
            continue;
        }
        if (instance.hidden) {
            continue;
        }
        var bottomOffset = scrollOffsetTop + viewportHeight + instance.buffer;
        var visible = false;
        if (bottomOffset > instance.elementPos.y) {
            var cumulativeTop = scrollOffsetTop + viewportTop - instance.buffer;
            var cumulativeBottom = scrollOffsetTop + viewportTop + viewportHeight + instance.buffer;
            var elemBottom = instance.elementPos.y + instance.elementHeight;
            var _visible = !instance.strict || (cumulativeTop < instance.elementPos.y && cumulativeBottom > elemBottom);

            visible = _visible;
            if (visible && instance.scrollArea) {
                var scrollBottom = instance.scrollAreaY + instance.scrollAreaHeight + instance.buffer;
                visible = (instance.elementPos.y > instance.scrollAreaY - instance.buffer) && (instance.elementPos.y < scrollBottom);
            }
        }
        if (instance.inverse ? !visible : visible) {
            instance.remove();
            instance.handler(t.indexOf(fa) !== -1);
        }
    }
}

function setup() {
    checkBuffer();
    if (instances.length) {
        return;
    }
    onWinScroll = Event.listen(window, 'scroll', checkBuffer);
    onWinResize = Event.listen(window, 'resize', checkBuffer);
    onDomScroll = Arbiter.subscribe('dom-scroll', checkBuffer);
}

function checkBuffer() {
    queryThenMutateDOM(queryDOM, mutateDOM, 'OnVisible/positionCheck');
}

function OnVisible(element, handler, strict, buffer, inverse, scrollArea) {
    this.element = element;
    this.handler = handler;
    this.strict = strict;
    this.buffer = coalesce(buffer, 300);
    this.inverse = coalesce(inverse, false);
    this.scrollArea = scrollArea || null;
    if (this.scrollArea) {
        this.scrollAreaListener = this._setupScrollAreaListener();
    }
    if (instances.length === 0) {
        Run.onLeave(teardown);
    }
    setup();
    instances.push(this);
}
OnVisible.prototype.remove = function() {
    if (this.removed) {
        return;
    }
    this.removed = true;
    if (this.scrollAreaListener) {
        this.scrollAreaListener.remove();
    }
};
OnVisible.prototype.reset = function() {
    this.elementHeight = null;
    this.removed = false;
    if (this.scrollArea) {
        this.scrollAreaListener = this._setupScrollAreaListener();
    }
    instances.indexOf(this) === -1 && instances.push(this);
    setup();
};
OnVisible.prototype.setBuffer = function(buffer) {
    this.buffer = buffer;
    checkBuffer();
};
OnVisible.prototype.checkBuffer = function() {
    checkBuffer();
};
OnVisible.prototype.getElement = function() {
    return this.element;
};
OnVisible.prototype._setupScrollAreaListener = function() {
    return Event.listen(DOM.find(this.scrollArea, '.uiScrollableAreaWrap'), 'scroll', this.checkBuffer);
};

copyProperties(OnVisible, {
    checkBuffer: checkBuffer
});

module.exports = OnVisible;