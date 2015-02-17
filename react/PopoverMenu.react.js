/**
 * @providesModule PopoverMenu.react
 */
var CSS = require('./CSS');
var $InlineBlock = require('./InlineBlock.react');
var Popover = require('./Popover');
var PopoverMenu = require('./PopoverMenu');
var React = require('./React');
var ReactElement = require('./ReactElement');
var SubscriptionsHandler = require('./SubscriptionsHandler');
var joinClasses = require('./joinClasses');
var areEqual = require('./areEqual');
var setImmediate = require('./setImmediate');

var $PopoverMenu = React.createClass({
    displayName: "ReactPopoverMenu",
    statics: {
        getFirstChild: function(props) {
            var children = props.children;
            return Array.isArray(children) ? children[0] : children;
        },
        getButtonSize: function(props) {
            var child = $PopoverMenu.getFirstChild(props);
            return child && child.type.getButtonSize(child.props);
        }
    },
    propTypes: {
        alignh: React.PropTypes.oneOf(['left', 'center', 'right']),
        alignv: React.PropTypes.oneOf(['baseline', 'bottom', 'middle', 'top']),
        position: React.PropTypes.oneOf(['above', 'below', 'left', 'right']),
        layerBehaviors: React.PropTypes.array,
        menu: React.PropTypes.object,
        disabled: React.PropTypes.bool,
        open: React.PropTypes.bool
    },
    getDefaultProps: function() {
        return {
            alignv: 'middle'
        };
    },
    _menuSubscriptions: null,
    componentDidMount: function() {
        var popoverNode = this.refs.root.getDOMNode();
        var triggerElem = popoverNode.firstChild;
        CSS.addClass(triggerElem, "_p");
        this._popover = new Popover(
            popoverNode,
            triggerElem,
            this.props.layerBehaviors,
            {
                alignh: this.props.alignh,
                position: this.props.position,
                disabled: this.props.disabled
            }
        );
        this._popoverMenu = new PopoverMenu(
            this._popover,
            triggerElem,
            this._createMenu(this.props.menu),
            this.props.behaviors
        );
    },
    componentDidUpdate: function(prevProps) {
        if (!areEqual(prevProps.menu, this.props.menu)) {
            setImmediate(this._recreateMenu);
        }
        if (this.props.alignh !== prevProps.alignh) {
            this._popoverMenu.
              getPopover().
              getLayer().
              setAlignment(this.props.alignh);
        }
        if (this.props.disabled !== prevProps.disabled) {
            if (this.props.disabled) {
                this._popoverMenu.disable();
            } else {
                this._popoverMenu.enable();
            }
        }
    },
    _recreateMenu: function() {
        if (this._menuSubscriptions) {
            this._menuSubscriptions.release();
            this._menuSubscriptions = null;
        }
        this._unmountCurrentMenuItems();
        this._popoverMenu.setMenu(this._createMenu(this.props.menu));
    },
    render: function() {
        var children = React.Children.map(this.props.children, function(child, index) {
            if (index === 0) {
                return ReactElement.cloneAndReplaceProps(
                    child,
                    Object.assign({}, child.props, {
                        className: joinClasses(child.props.className, "_p")
                    })
                );
            } else {
                return child;
            }
        });
        return (
            React.createElement(
                $InlineBlock,
                React.__spread({}, this.props, {
                    className: joinClasses(this.props.className, "uiPopover"),
                    ref: "root",
                    disabled: null
                }),
                children
            )
        );
    },
    componentWillUnmount: function() {
        this.hidePopover();
        if (this._menuSubscriptions) {
            this._menuSubscriptions.release();
            this._menuSubscriptions = null;
        }
    },
    _createMenu: function(menuConfig) {
        var props = menuConfig.props;
        var menuObj = new menuConfig.type(props);
        this._menuSubscriptions = new SubscriptionsHandler();
        if (props.onItemClick) {
            this._menuSubscriptions.addSubscriptions(menuObj.subscribe('itemclick', props.onItemClick));
        }
        if (props.onItemFocus) {
            this._menuSubscriptions.addSubscriptions(menuObj.subscribe('focus', props.onItemFocus));
        }
        if (props.onItemBlur) {
            this._menuSubscriptions.addSubscriptions(menuObj.subscribe('blur', props.onItemBlur));
        }
        if (props.onChange) {
            this._menuSubscriptions.addSubscriptions(menuObj.subscribe('change', props.onChange));
        }
        if (this.props.onShow) {
            this._menuSubscriptions.addSubscriptions(this._popover.subscribe('show', this.props.onShow));
        }
        if (this.props.onHide) {
            this._menuSubscriptions.addSubscriptions(this._popover.subscribe('hide', this.props.onHide));
        }
        return menuObj;
    },
    getMenu: function() {
        return this._popoverMenu.getMenu();
    },
    showPopover: function(item) {
        this._popover.showLayer();
        if (item) {
            var menu = this._popoverMenu.getMenu();
            menu.blur();
            menu.focusAnItem(item);
        }
    },
    hidePopover: function() {
        var popover = this._popover;
        if (popover.isShown()) {
            popover.hideLayer();
        }
    },
    getFocusedItem: function() {
        var menu = this._popoverMenu.getMenu(); // @todo: this can be replaced with 'this.getMenu()'
        return menu.getFocusedItem();
    },
    _unmountCurrentMenuItems: function() {
        var menu = this.getMenu();
        if (!menu) {
            return;
        }
        menu.forEachItem(function(item) {
            var rowNode = item.getRoot().firstElementChild;
            if (!rowNode) {
                return;
            }
            React.unmountComponentAtNode(rowNode);
        });
    }
});
module.exports = $PopoverMenu;