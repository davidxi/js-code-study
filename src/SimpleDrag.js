/**
 * @providesModule SimpleDrag
 */
var Event = require('./Event');
var ArbiterMixin = require('./ArbiterMixin');
var UserAgent_DEPRECATED = require('./UserAgent_DEPRECATED');
var Vector = require('./Vector');
var copyProperties = require('./copyProperties');
var emptyFunction = require('./emptyFunction');

function SimpleDrag(element) {
    this.minDragDistance = 0;
    Event.listen(element, 'mousedown', this._start.bind(this));
}

copyProperties(SimpleDrag.prototype, ArbiterMixin, {
    setMinDragDistance: function(pixels) {
        this.minDragDistance = pixels;
    },
    _start: function(event) {
        var isSuccessfulDrag = false,
            isPreventEvent = true,
            mousedownPos = null;
        if (this.inform('mousedown', event)) {
            isPreventEvent = false;
        }
        if (this.minDragDistance) {
            mousedownPos = Vector.getEventPosition(event);
        } else {
            isSuccessfulDrag = true;
            var q = this.inform('start', event);
            if (q === true) {
                isPreventEvent = false;
            } else if (q === false) {
                isSuccessfulDrag = false;
                return;
            }
        }

        var docRoot = UserAgent_DEPRECATED.ie() < 9 ? document.documentElement : window;

        // eventSubscriptions instanceof Event::EventSubscription
        //   { remove: function(), fire : function(elem, event) }
        var eventSubscriptions = Event.listen(docRoot, {
            selectstart: isPreventEvent ? Event.prevent : emptyFunction,
            mousemove: function(event) {
                if (!isSuccessfulDrag) {
                    var mousemovePos = Vector.getEventPosition(event);
                    if (mousedownPos.distanceTo(mousemovePos) < this.minDragDistance) {
                        return;
                    }
                    isSuccessfulDrag = true;
                    if (this.inform('start', event) === false) {
                        isSuccessfulDrag = false;
                        return;
                    }
                }
                this.inform('update', event);
            }.bind(this),
            mouseup: function(event) {
                for (var eventType in eventSubscriptions) {
                    // 'eventType' in ['mousemove', 'mouseup']
                    eventSubscriptions[eventType].remove();
                }
                if (isSuccessfulDrag) {
                    this.inform('end', event);
                } else {
                    this.inform('click', event);
                }
            }.bind(this)
        });
        isPreventEvent && event.prevent();
    }
});

module.exports = SimpleDrag;