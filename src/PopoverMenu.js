/**
 * @providesModule PopoverMenu
 */
var Arbiter = require('./Arbiter');
var ArbiterMixin = require('./ArbiterMixin');
var ARIA = require('./ARIA');
var BehaviorsMixin = require('./BehaviorsMixin');
var Event = require('./Event');
var Focus = require('./Focus');
var Keys = require('./Keys');
var KeyStatus = require('./KeyStatus');
var copyProperties = require('./copyProperties');
var mixin = require('./mixin');

var propsArbiterMixin = mixin(ArbiterMixin, BehaviorsMixin);
for (var r in propsArbiterMixin) {
    if (propsArbiterMixin.hasOwnProperty(r)) {
        PopoverMenu[r] = propsArbiterMixin[r];
    }
}
var protoArbiterMixin = propsArbiterMixin === null ? null : propsArbiterMixin.prototype;
PopoverMenu.prototype = Object.create(protoArbiterMixin);
PopoverMenu.prototype.constructor = PopoverMenu;
PopoverMenu.__superConstructor__ = propsArbiterMixin;

function PopoverMenu(popover, triggerElem, initialMenu, behaviors) {
    // this._popover = {
    //    "_root" : element (div.uiPopover),
    //    "_triggerElem" : element (a),
    //    "_behaviors" : array,
    //    "_config" : {alignh},
    //    "_disabled" : boolean,
    //    "_listeners" : array
    // }
    this._popover = popover;
    this._triggerElem = triggerElem;
    // this._initialMenu = {
    //    "_config" : {behavoirs, className, id, theme},
    //    "_items" : [{data, disabled, onclickHandler, selected}, {...}],
    //    "_theme" : {className}
    // }
    this._initialMenu = initialMenu;
    popover.subscribe('init', this._onLayerInit.bind(this));
    popover.subscribe('show', this._onPopoverShow.bind(this));
    popover.subscribe('hide', this._onPopoverHide.bind(this));
    Event.listen(this._triggerElem, 'keydown', this._handleKeyEventOnTrigger.bind(this));
    behaviors && this.enableBehaviors(behaviors);
}
PopoverMenu.prototype.getContentRoot = function() {
    return this._popover.getContentRoot();
};
PopoverMenu.prototype.setMenu = function(menuObj) {
    this._menu = menuObj;
    var rootNode = menuObj.getRoot();
    this._popover.setLayerContent(rootNode);
    menuObj.subscribe('done', this._onMenuDone.bind(this));
    if (this._popoverShown) {
        this._menu.onShow();
    }
    ARIA.owns(this._triggerElem, rootNode);
    this.inform('setMenu', null, Arbiter.BEHAVIOR_PERSISTENT);
};
PopoverMenu.prototype.getPopover = function() {
    return this._popover;
};
PopoverMenu.prototype.getTriggerElem = function() {
    return this._triggerElem;
};
PopoverMenu.prototype.getInitialMenu = function() {
    return this._initialMenu;
};
PopoverMenu.prototype.getMenu = function() {
    return this._menu;
};
PopoverMenu.prototype._onLayerInit = function() {
    this.setMenu(this._initialMenu);
    this._popover.getLayer().subscribe('key', this._handleKeyEvent.bind(this));
};
PopoverMenu.prototype._onPopoverShow = function() {
    if (this._menu) {
        this._menu.onShow();
    }
    this._popoverShown = true;
};
PopoverMenu.prototype._onPopoverHide = function() {
    if (this._menu) {
        this._menu.onHide();
    }
    this._popoverShown = false;
};
PopoverMenu.prototype._handleKeyEvent = function(arbiterEvt, event) {
    var keyCode = Event.getKeyCode(event);
    if (keyCode === Keys.TAB) {
        this._popover.hideLayer();
        Focus.set(this._triggerElem);
        return;
    }
    if (event.getModifiers().any) {
        return;
    }
    switch (keyCode) {
        case Keys.RETURN:
            return;
        default:
            if (this._menu.handleKeydown(keyCode, event) === false) {
                this._menu.blur();
                this._menu.handleKeydown(keyCode, event);
            }
            break;
    }
    event.prevent();
};
PopoverMenu.prototype._handleKeyEventOnTrigger = function(event) {
    var keyCode = Event.getKeyCode(event);
    var w = String.fromCharCode(keyCode).toLowerCase();
    if (/^\w$/.test(w)) {
        this._popover.showLayer();
        this._menu.blur();
        if (this._menu.handleKeydown(keyCode, event) === false) {
            this._popover.hideLayer();
            Focus.set(this._triggerElem);
        }
    }
};
PopoverMenu.prototype._onMenuDone = function(arbiterEvt) {
    var isKeyDown = KeyStatus.isKeyDown();
    setTimeout(function() {
        this._popover.hideLayer();
        if (isKeyDown) {
            Focus.set(this._triggerElem);
        }
    }.bind(this), 0);
};
PopoverMenu.prototype.enable = function() {
    this._popover.enable();
};
PopoverMenu.prototype.disable = function() {
    this._popover.disable();
};

copyProperties(PopoverMenu.prototype, {
    _popoverShown: false
});

module.exports = PopoverMenu;