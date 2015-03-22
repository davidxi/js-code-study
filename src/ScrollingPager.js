/**
 * @providesModule ScrollingPager
 */
var Arbiter = require('./Arbiter');
var CSS = require('./CSS');
var DOM = require('./DOM');
var OnVisible = require('./OnVisible');
var UIPagelet = require('./UIPagelet');
var $ = require('./$');
var copyProperties = require('./copyProperties');
var ge = require('./ge');

var instances = {};

function ScrollingPager(scrollLoaderId, pageletSrc, data, options) {
    this.scroll_loader_id = scrollLoaderId;
    this.pagelet_src = pageletSrc;
    this.data = data;
    this.options = options || {};
    if (this.options.target_id) {
        this.target_id = this.options.target_id;
        this.options.append = true;
    } else {
        this.target_id = scrollLoaderId;
    }
    this.scroll_area_id = this.options.scroll_area_id;
    this.handler = null;
}
ScrollingPager.prototype.setBuffer = function(buffer) {
    this.options.buffer = buffer;
    this.onvisible && this.onvisible.setBuffer(buffer);
};
ScrollingPager.prototype.getBuffer = function() {
    return this.options.buffer;
};
ScrollingPager.prototype.register = function() {
    this.onvisible = new OnVisible(
        $(this.scroll_loader_id), // element
        this.getHandler(), // handler
        false, // strict
        this.options.buffer, // buffer
        false, // inverse
        ge(this.scroll_area_id) // scrollArea
    );
    instances[this.scroll_loader_id] = this;
    Arbiter.inform(ScrollingPager.REGISTERED, {
        id: this.scroll_loader_id
    });
};
ScrollingPager.prototype.getInstance = function(scrollLoaderId) {
    return instances[scrollLoaderId];
};
ScrollingPager.prototype.getHandler = function() {
    if (this.handler) {
        return this.handler;
    }

    function defaultHandler(isPagerFiredOnInit) {
        var scrollLoaderElem = ge(this.scroll_loader_id);
        if (!scrollLoaderElem) {
            this.onvisible.remove();
            return;
        }
        CSS.addClass(scrollLoaderElem.firstChild, 'async_saving');

        var _handler = this.options.handler;
        var isRemovePager = this.options.force_remove_pager && (this.scroll_loader_id !== this.target_id);

        this.options.handler = function() {
            Arbiter.inform('ScrollingPager/loadingComplete');
            _handler && _handler.apply(null, arguments);
            if (isRemovePager) {
                DOM.remove(scrollLoaderElem);
            }
        };
        if (isPagerFiredOnInit) {
            this.data.pager_fired_on_init = true;
        }
        UIPagelet.loadFromEndpoint(
            this.pagelet_src,
            this.target_id,
            this.data,
            this.options
        );
    }
    return defaultHandler.bind(this);
};
ScrollingPager.prototype.setHandler = function(handler) {
    this.handler = handler;
};
ScrollingPager.prototype.removeOnVisible = function() {
    this.onvisible.remove();
};
ScrollingPager.prototype.checkBuffer = function() {
    this.onvisible && this.onvisible.checkBuffer();
};
ScrollingPager.getInstance = function(scrollLoaderId) {
    return instances[scrollLoaderId];
};
copyProperties(ScrollingPager, {
    REGISTERED: 'ScrollingPager/registered'
});
module.exports = ScrollingPager;