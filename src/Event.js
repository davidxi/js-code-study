/**
 * @providesModule Event
 */
var Arbiter = require('Arbiter');
var DataStore = require('DataStore');
var DOMQuery = require('DOMQuery');
var DOMEvent = require('DOMEvent');
var ErrorUtils = require('ErrorUtils');
var ExecutionEnvironment = require('ExecutionEnvironment');
var Parent = require('Parent');
var UserAgent_DEPRECATED = require('UserAgent_DEPRECATED');
var DOMEventListener = require('DOMEventListener');
var $ = require('$');
var copyProperties = require('copyProperties');
var invariant = require('invariant');
var getObjectValues = require('getObjectValues');

require('event-form-bubbling');

// in module 'event-form-bubbling'
// global.Event = global.Event || {}
var Event = global.Event;
var HandlersDataStoreKey = 'Event.listeners';

if (!Event.prototype) {
    Event.prototype = {};
}

function informEventStopExternal(event) {
    if (event.type === 'click' || event.type === 'mouseover' || event.type === 'keydown') {
        Arbiter.inform('Event/stop', {
            event: event
        });
    }
}

function EventObject(elem, eventType, data) {
    this.target = elem;
    this.type = eventType;
    this.data = data;
}
copyProperties(EventObject.prototype, {
    getData: function() {
        this.data = this.data || {};
        return this.data;
    },
    stop: function() {
        return Event.stop(this);
    },
    prevent: function() {
        return Event.prevent(this);
    },
    isDefaultPrevented: function() {
        return Event.isDefaultPrevented(this);
    },
    kill: function() {
        return Event.kill(this);
    },
    getTarget: function() {
        return new DOMEvent(this).target || null;
    }
});

function normalizeEventObj(eventObj) {
    if (eventObj instanceof EventObject) {
        return eventObj;
    }
    if (!eventObj) {
        if (!window.addEventListener && document.createEventObject) {
            eventObj = window.event ?
                document.createEventObject(window.event) : {};
        } else {
            eventObj = {};
        }
    }
    if (!eventObj._inherits_from_prototype) {
        for (var ga in Event.prototype) {
            try {
                eventObj[ga] = Event.prototype[ga];
            } catch (ha) {}
        }
    }
    return eventObj;
}
copyProperties(Event.prototype, {
    _inherits_from_prototype: true,
    getRelatedTarget: function() {
        var relatedTarget = this.relatedTarget || (this.fromElement === this.srcElement ? this.toElement : this.fromElement);
        return relatedTarget && relatedTarget.nodeType ? relatedTarget : null;
    },
    getModifiers: function() {
        var fa = {
            control: !!this.ctrlKey,
            shift: !!this.shiftKey,
            alt: !!this.altKey,
            meta: !!this.metaKey
        };
        fa.access = UserAgent_DEPRECATED.osx() ? fa.control : fa.alt;
        fa.any = fa.control || fa.shift || fa.alt || fa.meta;
        return fa;
    },
    isRightClick: function() {
        if (this.which) {
            return this.which === 3;
        }
        return this.button && this.button === 2;
    },
    isMiddleClick: function() {
        if (this.which) {
            return this.which === 2;
        }
        return this.button && this.button === 4;
    },
    isDefaultRequested: function() {
        return this.getModifiers().any ||
                this.isMiddleClick() ||
                this.isRightClick();
    }
});
copyProperties(Event.prototype, EventObject.prototype);
copyProperties(Event, {
    listen: function(elem, eventType, handler, priority) {
        if (!ExecutionEnvironment.canUseDOM) {
            return new EventSubscription(handler, handlers, eventType, priority, subscriptionId);
        }
        if (typeof elem == 'string') {
            elem = $(elem);
        }
        if (typeof priority == 'undefined') {
            priority = Event.Priority.NORMAL;
        }
        if (typeof eventType == 'object') {
            var subscriptions= {};
            for (var singleEventType in eventType) {
                subscriptions[singleEventType] = Event.listen(elem, singleEventType, eventType[singleEventType], priority);
            }
            return subscriptions;
        }

        if (eventType.match(/^on/i)) {
            throw new TypeError("Bad event name `" + eventType + "': use `click', not `onclick'.");
        }

        if (elem.nodeName == 'LABEL' && eventType == 'click') {
            var la = elem.getElementsByTagName('input'); // @todo: how about <label for="input_name"> case ?
            elem = la.length == 1 ? la[0] : elem;
        } else if (elem === window && eventType === 'scroll') {
            var ma = DOMQuery.getDocumentScrollElement();
            if (ma !== document.documentElement && ma !== document.body) {
                elem = ma;
            }
        }
        var handlers = DataStore.get(elem, HandlersDataStoreKey, {});
        var eventHandlerWrapper = EventHandlerWrapperMap[eventType];
        if (eventHandlerWrapper) {
            eventType = eventHandlerWrapper.base;
            if (eventHandlerWrapper.wrap) {
                handler = eventHandlerWrapper.wrap(handler);
            }
        }
        setupDOMhandlerOnEvent(elem, handlers, eventType);

        var handlersOnThisType = handlers[eventType];
        if (!(priority in handlersOnThisType)) {
            handlersOnThisType[priority] = [];
        }

        var subscriptionId = handlersOnThisType[priority].length;
        var subscription = new EventSubscription(handler, handlers, eventType, priority, subscriptionId);

        handlersOnThisType[priority][subscriptionId] = subscription;
        handlersOnThisType.numHandlers++;
        return subscription;
    },
    stop: function(event) {
        var domEvent = new DOMEvent(event).stopPropagation();
        informEventStopExternal(domEvent.event); // domEvent.event = event || window.event
        return event;
    },
    prevent: function(event) {
        new DOMEvent(event).preventDefault();
        return event;
    },
    isDefaultPrevented: function(event) {
        return new DOMEvent(event).isDefaultPrevented(event); // @todo: DOMEvent.isDefaultPrevented() does not need arguments
    },
    kill: function(event) {
        var domEvent = new DOMEvent(event).kill();
        informEventStopExternal(domEvent.event);
        return false;
    },
    getKeyCode: function(event) {
        event = new DOMEvent(event).event;
        // purpose of DOMEvent(event).event
        // make sure @param(event) is a real DOM event. inside DOMEvent constructor, there is
        //    invariant(typeof(this.event.srcElement) != 'unknown')
        if (!event) {
            return false;
        }
        switch (event.keyCode) {
            case 63232:
                return 38; // @todo: why not require('Keys') and use key code constants from there
            case 63233:
                return 40;
            case 63234:
                return 37;
            case 63235:
                return 39;
            case 63272:
            case 63273:
            case 63275:
                return null;
            case 63276:
                return 33;
            case 63277:
                return 34;
        }
        if (event.shiftKey) {
            switch (event.keyCode) {
                case 33:
                case 34:
                case 37:
                case 38:
                case 39:
                case 40:
                    return null;
            }
        }
        return event.keyCode;
    },
    getPriorities: function() /* ordered array */ {
        if (!cachedEventPrioryKeys) {
            var fa = getObjectValues(Event.Priority);
            fa.sort(function(ga, ha) {
                return ga - ha;
            });
            cachedEventPrioryKeys = fa;
        }
        return cachedEventPrioryKeys;
    },
    fire: function(elem, eventType, data) {
        var eventObject = new EventObject(elem, eventType, data),
            handlerReturned;
        do {
            var handler = Event.__getHandler(elem, eventType);
            if (handler) {
                handlerReturned = handler(eventObject);
            }
            elem = elem.parentNode;
        } while (elem && handlerReturned !== false && !eventObject.cancelBubble); // @todo: 'cancelBubble' prop is not in EventObject constructor
        return handlerReturned !== false;
    },
    __fire: function(elem, eventType, event) {
        var handler = Event.__getHandler(elem, eventType);
        if (handler) {
            return handler(normalizeEventObj(event));
        }
    },
    __getHandler: function(elem, eventType) {
        var handler = DataStore.get(elem, HandlersDataStoreKey);
        if (handler && handler[eventType]) {
            return handler[eventType].domHandler;
        }
    },
    getPosition: function(event) {
        event = new DOMEvent(event).event;
        var pageOffset = DOMQuery.getDocumentScrollElement(),
            left = event.clientX + pageOffset.scrollLeft,
            top = event.clientY + pageOffset.scrollTop;
        return {
            x: left,
            y: top
        };
    }
});
var cachedEventPrioryKeys = null;
var wrapHanlderFunction = function(handler) {
    return function(event) {
        if (!DOMQuery.contains(this, event.getRelatedTarget())) {
            return handler.call(this, event);
        }
    };
};
var EventHandlerWrapperMap;
if (!window.navigator.msPointerEnabled) {
    EventHandlerWrapperMap = {
        mouseenter: {
            base: 'mouseover',
            wrap: wrapHanlderFunction
        },
        mouseleave: {
            base: 'mouseout',
            wrap: wrapHanlderFunction
        }
    };
} else {
    EventHandlerWrapperMap = {
        mousedown: {
            base: 'MSPointerDown'
        },
        mousemove: {
            base: 'MSPointerMove'
        },
        mouseup: {
            base: 'MSPointerUp'
        },
        mouseover: {
            base: 'MSPointerOver'
        },
        mouseout: {
            base: 'MSPointerOut'
        },
        mouseenter: {
            base: 'MSPointerOver',
            wrap: wrapHanlderFunction
        },
        mouseleave: {
            base: 'MSPointerOut',
            wrap: wrapHanlderFunction
        }
    };
}
if (UserAgent_DEPRECATED.firefox()) {
    var bubbleFocusEvent = function(eventType, event) {
        event = normalizeEventObj(event);
        var elem = event.getTarget();
        while (elem) {
            Event.__fire(elem, eventType, event);
            elem = elem.parentNode;
        }
    };
    document.documentElement.addEventListener('focus', bubbleFocusEvent.bind(null, 'focusin'), true);
    document.documentElement.addEventListener('blur', bubbleFocusEvent.bind(null, 'focusout'), true);
}
var setupDOMhandlerOnEvent = function(elem, handlers, eventType) {
    if (eventType in handlers) {
        return;
    }
    var _handlerOnDOM = invokeRegisterHandlersOnEventType.bind(elem, eventType);
    handlers[eventType] = {
        numHandlers: 0,
        domHandlerRemover: DOMEventListener.add(elem, eventType, _handlerOnDOM),
        domHandler: _handlerOnDOM
    };
    if (elem['on' + eventType]) {
        var priority = elem === document.documentElement ?
            Event.Priority._BUBBLE :
            Event.Priority.TRADITIONAL;
        var _inlineHandler = elem['on' + eventType];
        elem['on' + eventType] = null;
        Event.listen(elem, eventType, _inlineHandler, priority);
    }
    if (elem.nodeName === 'FORM' && eventType === 'submit') {
        Event.listen(elem, eventType, Event.__bubbleSubmit.bind(null, elem), Event.Priority._BUBBLE);
    }
};
var invokeRegisterHandlersOnEventType = function(eventType, event) {
    event = normalizeEventObj(event);
    if (!DataStore.get(this, HandlersDataStoreKey)) {
        throw new Error("Bad listenHandler context.");
    }

    // get all registered handlers on this event type
    var handlersOnThisType = DataStore.get(this, HandlersDataStoreKey)[eventType];

    if (!handlersOnThisType) {
        throw new Error("No registered handlers for `" + eventType + "'.");
    }
    if (eventType == 'click') {
        var clickedLinkNode = Parent.byTag(event.getTarget(), 'a');
        if (window.userAction) {
            window.userAction('evt_ext', clickedLinkNode, event, {
                mode: 'DEDUP'
            }).uai_fallback('click');
        }
        if (window.clickRefAction) {
            window.clickRefAction('click', clickedLinkNode, event);
        }
    }

    var allPriorityKeys = Event.getPriorities();
    // Event.getPriorities() returns ordered priority keys, so it
    // guarantees top priority handlers got called firstly.
    for (var ka = 0; ka < allPriorityKeys.length; ka++) {
        var priority = allPriorityKeys[ka];
        if (priority in handlersOnThisType) {
            var handlersOnThisPriority = handlersOnThisType[priority];
            for (var na = 0; na < handlersOnThisPriority.length; na++) {
                if (!handlersOnThisPriority[na]) {
                    continue;
                }
                var handlerReturned = handlersOnThisPriority[na].fire(this, event);
                if (handlerReturned === false) {
                    return event.kill();
                } else if (event.cancelBubble) {
                    event.stop();
                }
            }
        }
    }
    return event.returnValue;
};
Event.Priority = {
    URGENT: -20,
    TRADITIONAL: -10,
    NORMAL: 0,
    _BUBBLE: 1000
};

function EventSubscription(handler, handlers, eventType, priority, subscriptionId) {
    this._handler = handler;
    this._handlers = handlers;
    this._type = eventType;
    this._priority = priority;
    this._id = subscriptionId;
}
copyProperties(EventSubscription.prototype, {
    remove: function() {
        if (ExecutionEnvironment.canUseDOM) {
            invariant(this._handlers);
            var handlersOnThisType = this._handlers[this._type];
            if (handlersOnThisType.numHandlers <= 1) {
                handlersOnThisType.domHandlerRemover.remove();
                delete this._handlers[this._type];
            } else {
                delete handlersOnThisType[this._priority][this._id];
                handlersOnThisType.numHandlers--;
            }
            this._handlers = null; // reference--, gabarge recycle ~
        }
    },
    fire: function(elem, event) {
        if (ExecutionEnvironment.canUseDOM) {
            return ErrorUtils.applyWithGuard(this._handler, elem, [event], function(ga) {
                ga.event_type = event.type;
                ga.dom_element = elem.name || elem.id;
                ga.category = 'eventhandler';
            });
        }
        return true;
    }
});

global.$E = Event.$E = normalizeEventObj;
module.exports = Event;