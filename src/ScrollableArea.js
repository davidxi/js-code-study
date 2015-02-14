/**
 * @providesModule ScrollableArea
 */
var Animation = require('./Animation');
var ArbiterMixin = require('./ArbiterMixin');
var BrowserSupport = require('./BrowserSupport');
var CSS = require('./CSS');
var DataStore = require('./DataStore');
var DOM = require('./DOM');
var Event = require('./Event');
var Parent = require('./Parent');
var Run = require('./Run');
var SimpleDrag = require('./SimpleDrag');
var Style = require('./Style');
var UserAgent_DEPRECATED = require('./UserAgent_DEPRECATED');
var Vector = require('./Vector');
var throttle = require('./throttle');
var mixin = require('./mixin');

var propsArbiterMixin = mixin(ArbiterMixin);
for (var x in propsArbiterMixin)
    if (propsArbiterMixin.hasOwnProperty(x)) {
        ScrollableArea[x] = propsArbiterMixin[x];
    }
var protoArbiterMixin = propsArbiterMixin === null ? null : propsArbiterMixin.prototype;
ScrollableArea.prototype = Object.create(protoArbiterMixin);
ScrollableArea.prototype.constructor = ScrollableArea;
ScrollableArea.__superConstructor__ = propsArbiterMixin;

function ScrollableArea(container, options) {
    if (!container) {
        return;
    }
    options = options || {};

    this._elem = container;
    this._wrap = DOM.find(container, 'div.uiScrollableAreaWrap');
    this._body = DOM.find(this._wrap, 'div.uiScrollableAreaBody');
    this._content = DOM.find(this._body, 'div.uiScrollableAreaContent');
    this._track = DOM.find(container, 'div.uiScrollableAreaTrack');
    this._gripper = DOM.find(this._track, 'div.uiScrollableAreaGripper');

    this._options = options;
    this._throttledComputeHeights = throttle.withBlocking(this._computeHeights, 250, this);
    this.throttledAdjustGripper = throttle.withBlocking(this.adjustGripper, 250, this);
    this._throttledShowGripperAndShadows = throttle.withBlocking(this._showGripperAndShadows, 250, this);
    this._throttledRespondMouseMove = throttle(this._respondMouseMove, 250, this);
    setTimeout(this.adjustGripper.bind(this), 0);

    this._listeners = [
        Event.listen(this._wrap, 'scroll', this._handleScroll.bind(this)),
        Event.listen(container, 'mousemove', this._handleMouseMove.bind(this)),
        Event.listen(this._track, 'click', this._handleClickOnTrack.bind(this))
    ];

    if (BrowserSupport.hasPointerEvents()) {
        this._listeners.push(
            Event.listen(container, 'mousedown', this._handleClickOnTrack.bind(this))
        );
    }
    if (options.fade !== false) {
        this._listeners.push(
            Event.listen(container, 'mouseenter', this._handleMouseEnter.bind(this)),
            Event.listen(container, 'mouseleave', this._handleMouseLeave.bind(this)),
            Event.listen(container, 'focusin', this.showScrollbar.bind(this, false)),
            Event.listen(container, 'focusout', this.hideScrollbar.bind(this))
        );
    } else if (BrowserSupport.hasPointerEvents()) {
        this._listeners.push(
            container.listen(container, 'mouseleave', CSS.removeClass.bind(null, container, 'uiScrollableAreaTrackOver'))
        );
    }
    if (UserAgent_DEPRECATED.webkit() || UserAgent_DEPRECATED.chrome()) {
        this._listeners.push(Event.listen(container, 'mousedown', function() {
            var evtMouseUpSubscription = Event.listen(window, 'mouseup', function() {
                if (container.scrollLeft) {
                    container.scrollLeft = 0;
                }
                evtMouseUpSubscription.remove();
            });
        }));
    } else if (UserAgent_DEPRECATED.firefox()) {
        this._wrap.addEventListener('DOMMouseScroll', function(event) {
            event.axis === event.HORIZONTAL_AXIS && event.preventDefault();
        }, false);
    }

    this.initDrag();

    DataStore.set(this._elem, 'ScrollableArea', this);

    if (!options.persistent) {
        Run.onLeave(this.destroy.bind(this));
    }
    if (options.shadow !== false) {
        CSS.addClass(this._elem, 'uiScrollableAreaWithShadow');
    }
}
ScrollableArea.prototype.getElement = function() {
    return this._elem;
};
ScrollableArea.prototype.initDrag = function() {
    var hasPointerEvents = BrowserSupport.hasPointerEvents();
    var drag = new SimpleDrag(hasPointerEvents ? this._elem : this._gripper);
    // @todo: why not use this.getElement() to retrieve 'this._elem'

    drag.subscribe('start', function(memo, event) {
        // since drag bound to mousedown, so need to evaluate if it it happens when in plain left-click
        if (!((event.which && event.which === 1) || (event.button && event.button === 1))) {
            return;
        }

        var elemOffset = Vector.getEventPosition(event, 'viewport');
        if (hasPointerEvents) {
            var gripperOffset = this._gripper.getBoundingClientRect();
            if (elemOffset.x < gripperOffset.left ||
                elemOffset.x > gripperOffset.right ||
                elemOffset.y < gripperOffset.top ||
                elemOffset.y > gripperOffset.bottom) {
                // drag mousdown event happens outside gripper
                return false;
            }
        }
        this.inform('grip_start');

        var mousedownOffsetTop = elemOffset.y;
        var mousedownGripperOffsetTop = this._gripper.offsetTop;
        CSS.addClass(this._elem, 'uiScrollableAreaDragging');

        var evtDragUpdateSubscription = drag.subscribe('update', function(memo, event) {
            var mousemoveOffsetTopDelta = Vector.getEventPosition(event, 'viewport').y - mousedownOffsetTop;

            this._throttledComputeHeights();

            var mousemoveGripperOffsetTop = mousedownGripperOffsetTop + mousemoveOffsetTopDelta;
            var scrollableOffsetTop = this._trackHeight - this._gripperHeight;

            mousemoveGripperOffsetTop = Math.max(Math.min(mousemoveGripperOffsetTop, scrollableOffsetTop), 0);
            var estimatedContentOffsetTop = mousemoveGripperOffsetTop / scrollableOffsetTop * (this._contentHeight - this._containerHeight);

            this._wrap.scrollTop = estimatedContentOffsetTop;
        }.bind(this));
        // ./ drag::event('update')

        var evtDragEndSubscription = drag.subscribe('end', function() {
            drag.unsubscribe(evtDragUpdateSubscription);
            drag.unsubscribe(evtDragEndSubscription);
            CSS.removeClass(this._elem, 'uiScrollableAreaDragging');
            this.inform('grip_end');
        }.bind(this));
        // ./ drag::event('end')

    }.bind(this));
    // ./ drag::event('start')
};
ScrollableArea.prototype.adjustGripper = function() {
    if (this._needsGripper()) {
        Style.set(this._gripper, 'height', this._gripperHeight + 'px');
        this._slideGripper();
    }
    this._throttledShowGripperAndShadows();
    return this;
};
ScrollableArea.prototype._computeHeights = function() {
    this._containerHeight = this._elem.clientHeight;
    this._contentHeight = this._content.offsetHeight;
    this._trackHeight = this._track.offsetHeight;
    this._gripperHeight = Math.max(this._containerHeight / this._contentHeight * this._trackHeight, 12);
};
ScrollableArea.prototype._needsGripper = function() {
    this._throttledComputeHeights();
    return this._gripperHeight < this._trackHeight;
};
ScrollableArea.prototype._slideGripper = function() {
    var estimatedGripperOffsetTop = this._wrap.scrollTop / (this._contentHeight - this._containerHeight) * (this._trackHeight - this._gripperHeight);
    Style.set(this._gripper, 'top', estimatedGripperOffsetTop + 'px');
};
ScrollableArea.prototype._showGripperAndShadows = function() {
    CSS.conditionShow(this._gripper, this._needsGripper());
    CSS.conditionClass(this._elem, 'contentBefore', this._wrap.scrollTop > 0);
    CSS.conditionClass(this._elem, 'contentAfter', !this.isScrolledToBottom());
};
ScrollableArea.prototype.destroy = function() {
    this._listeners.forEach(function(evtSubscription) {
        evtSubscription.remove();
    });
    this._listeners.length = 0;
};
ScrollableArea.prototype._handleClickOnTrack = function(event) {
    // respond to DOMEvent::click on scroll bar
    var mousedownOffset = Vector.getEventPosition(event, 'viewport');
    var gripperOffset = this._gripper.getBoundingClientRect();
    if (mousedownOffset.x >= gripperOffset.right || mousedownOffset.x <= gripperOffset.left) {
        return;
    }
    if (mousedownOffset.y < gripperOffset.top) {
        // if click in upper part of the track, scroll upwards one page
        this.setScrollTop(this.getScrollTop() - this._elem.clientHeight);
    } else if (mousedownOffset.y > gripperOffset.bottom) {
        // if click in lower part of the track, scroll downwards one page
        this.setScrollTop(this.getScrollTop() + this._elem.clientHeight);
    }
    event.prevent();
};
ScrollableArea.prototype._handleMouseMove = function(event) {
    // respond to DOMEvent::mousemove inside whole container
    if (BrowserSupport.hasPointerEvents() || (this._options.fade !== false)) {
        this._mousePos = Vector.getEventPosition(event);
        this._throttledRespondMouseMove();
    }
};
ScrollableArea.prototype._respondMouseMove = function() {
    if (!this._mouseOver) {
        return;
    }
    var scrollBarPos = Vector.getElementPosition(this._track).x;
    var scrollBarWidth = Vector.getElementDimensions(this._track).x;
    var distanceToScrollBar = Math.abs(scrollBarPos + scrollBarWidth / 2 - this._mousePos.x);

    CSS.conditionClass(this._elem, 'uiScrollableAreaTrackOver', BrowserSupport.hasPointerEvents() && distanceToScrollBar <= 10);

    if (this._options.fade !== false) {
        if (distanceToScrollBar < 25) {
            this.showScrollbar(false);
        } else if (!this._options.no_fade_on_hover) {
            this.hideScrollbar();
        }
    }
};
ScrollableArea.prototype._handleScroll = function(event) {
    // respond to DOMEvent::scroll in the content area
    if (this._needsGripper()) {
        this._slideGripper();
    }
    this.throttledAdjustGripper();
    if (this._options.fade !== false) {
        this.showScrollbar();
    }
    this.inform('scroll');
};
ScrollableArea.prototype._handleMouseLeave = function() {
    this._mouseOver = false;
    this.hideScrollbar();
};
ScrollableArea.prototype._handleMouseEnter = function() {
    this._mouseOver = true;
    this.showScrollbar();
};
ScrollableArea.prototype.hideScrollbar = function(isUseAnimation) {
    if (!this._scrollbarVisible) {
        return this;
    }
    this._scrollbarVisible = false;
    if (this._hideTimeout) {
        clearTimeout(this._hideTimeout);
        this._hideTimeout = null;
    }
    if (isUseAnimation) {
        Style.set(this._track, 'opacity', 0);
        CSS.addClass.bind(null, this._track, 'invisible_elem');
    } else {
        this._hideTimeout = setTimeout(function() {
            if (this._hideAnimation) {
                this._hideAnimation.stop();
                this._hideAnimation = null;
            }
            this._hideAnimation =
                (new Animation(this._track)).
                  from('opacity', 1).
                  to('opacity', 0).
                  duration(250).
                  ondone(CSS.addClass.bind(null, this._track, 'invisible_elem')).
                  go();
        }.bind(this), 750);
    }
    return this;
};
ScrollableArea.prototype.resize = function() {
    if (this._body.style.width) {
        this._body.style.width = '';
    }
    // 'offsetWidth' includes :
    //      borders,
    //      horizontal padding,
    //      vertical scrollbar,
    //      CSS width
    // 'clientWidth' includes:
    //      horizontal padding, but not the vertical scrollbar,
    //      border,
    //      margin
    var nativeScrollbarWidth = this._wrap.offsetWidth - this._wrap.clientWidth;
    if (nativeScrollbarWidth > 0) {
        Style.set(this._body, 'margin-right', (0 - nativeScrollbarWidth) + 'px');
    }
    return this;
};
ScrollableArea.prototype.showScrollbar = function(isToFadeLater) {
    this.throttledAdjustGripper();
    if (this._scrollbarVisible) {
        return this;
    }
    this._scrollbarVisible = true;
    if (this._hideTimeout) {
        clearTimeout(this._hideTimeout);
        this._hideTimeout = null;
    }
    if (this._hideAnimation) {
        this._hideAnimation.stop();
        this._hideAnimation = null;
    }
    Style.set(this._track, 'opacity', 1);
    CSS.removeClass(this._track, 'invisible_elem');

    // This happens when mouse enter the scroll container,
    // we want to show the scroll bar to let user be aware of that
    // this is a scrollable area. Then after a short period, hide
    // the scroll bar.
    if ((isToFadeLater !== false) && !this._options.no_fade_on_hover) {
        this.hideScrollbar();
    }

    return this;
};
ScrollableArea.prototype.distanceToBottom = function() {
    this._computeHeights();
    return this._contentHeight - (this._wrap.scrollTop + this._containerHeight);
};
ScrollableArea.prototype.isScrolledToBottom = function() {
    return this.distanceToBottom() <= 0;
};
ScrollableArea.prototype.isScrolledToTop = function() {
    return this._wrap.scrollTop === 0;
};
ScrollableArea.prototype.scrollToBottom = function(isUseAnimation, options) {
    this.setScrollTop(this._wrap.scrollHeight, isUseAnimation, options);
};
ScrollableArea.prototype.scrollToTop = function(isUseAnimation) {
    this.setScrollTop(0, isUseAnimation);
};
ScrollableArea.prototype.scrollIntoView = function(elem, scrollOptions) {
    var wrapHeight = this._wrap.clientHeight; // scrollable area visible height
    var elemHeight = elem.offsetHeight;
    var currentOffsetTop = this._wrap.scrollTop;
    var bottomOffsetTop = currentOffsetTop + wrapHeight;
    var elemOffsetTop = elem.offsetTop;
    var elemBottomOffsetTop = elemOffsetTop + elemHeight;
    if (elemOffsetTop < currentOffsetTop || wrapHeight < elemHeight) {
        // scroll upwards
        this.setScrollTop(elemOffsetTop, scrollOptions);
    } else if (elemBottomOffsetTop > bottomOffsetTop) {
        // scroll downwards
        this.setScrollTop(currentOffsetTop + (elemBottomOffsetTop - bottomOffsetTop), scrollOptions);
    }
};
ScrollableArea.prototype.scrollElemToTop = function(elem, isUseAnimation, callback) {
    this.setScrollTop(elem.offsetTop, isUseAnimation, {
        callback: callback
    });
};
ScrollableArea.prototype.poke = function() {
    var offsetTop = this._wrap.scrollTop;
    this._wrap.scrollTop += 1;
    this._wrap.scrollTop -= 1;
    this._wrap.scrollTop = offsetTop;
    return this.showScrollbar(false);
};
ScrollableArea.prototype.getClientHeight = function() {
    return this._wrap.clientHeight;
};
ScrollableArea.prototype.getScrollTop = function() {
    return this._wrap.scrollTop;
};
ScrollableArea.prototype.getScrollHeight = function() {
    return this._wrap.scrollHeight;
};
ScrollableArea.prototype.setScrollTop = function(offsetTop, isUseAnimation, options) {
    options = options || {};
    if (isUseAnimation !== false) {
        if (this._scrollTopAnimation) {
            this._scrollTopAnimation.stop();
        }
        this._scrollTopAnimation =
            (new Animation(this._wrap)).
              to('scrollTop', offsetTop).
              ease(options.ease || Animation.ease.end).
              duration(options.duration || 250).
              ondone(options.callback).
              go();
    } else {
        this._wrap.scrollTop = offsetTop;
        options.callback && options.callback();
    }
};
ScrollableArea.renderDOM = function() {
    var contentNode = DOM.create('div', {
        className: 'uiScrollableAreaContent'
    });
    var bodyNode = DOM.create('div', {
        className: 'uiScrollableAreaBody'
    }, contentNode);
    var wrapNode = DOM.create('div', {
        className: 'uiScrollableAreaWrap scrollable'
    }, bodyNode);
    var rootNode = DOM.create('div', {
        className: 'uiScrollableArea native'
    }, wrapNode);
    return {
        root: rootNode,
        wrap: wrapNode,
        body: bodyNode,
        content: contentNode
    };
};
ScrollableArea.fromNative = function(container, options) {
    if (!CSS.hasClass(container, 'uiScrollableArea') || !CSS.hasClass(container, 'native')) {
        return;
    }
    options = options || {};
    CSS.removeClass(container, 'native');

    var scrollbarNode = DOM.create('div', {
        className: 'uiScrollableAreaTrack'
    }, DOM.create('div', {
        className: 'uiScrollableAreaGripper'
    }));
    DOM.appendContent(container, scrollbarNode);

    if (options.fade !== false) {
        CSS.addClass(container, 'fade');
        CSS.addClass(scrollbarNode, 'invisible_elem');
    } else {
        CSS.addClass(container, 'nofade');
    }

    var scrollableArea = new ScrollableArea(container, options);
    scrollableArea.resize();

    return scrollableArea;
};
ScrollableArea.getInstance = function(elem) {
    var containerNode = Parent.byClass(elem, 'uiScrollableArea');
    return containerNode ?
            DataStore.get(containerNode, 'ScrollableArea') :
            null;
};
ScrollableArea.poke = function(elem) {
    var scrollableArea = ScrollableArea.getInstance(elem);
    scrollableArea && scrollableArea.poke();
};
module.exports = ScrollableArea;