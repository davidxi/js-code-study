var React = require("react/addons");
var makeCodeDispatch = require("./makeCodeDispatch.js");

var classSet = React.addons.classSet;
var PropTypes = React.PropTypes;
var noop = function() {};

var $Option = React.createClass({
    displayName: "Option",
    propTypes: {
        value: PropTypes.any.isRequired,
        label: PropTypes.string,
        onSelect: PropTypes.func,
        onFocusAbove: PropTypes.func,
        onFocusBelow: PropTypes.func,
        onEscape: PropTypes.func,
        onBecameFocused: PropTypes.func,
        isSelected: PropTypes.bool,
        isFocused: PropTypes.bool,
        label: PropTypes.string,
    },
    getDefaultProps: function() {
        return {
            role: "option",
            isSelected: false,
            isFocused: false,
            label: null,
            onFocusAbove: noop,
            onFocusBelow: noop,
            onEscape: noop,
            onSelect: noop,
            onBecameFocused: noop
        }
    },
    onKeyDown: makeCodeDispatch({
        DownArrow: "onDownArrow",
        UpArrow: "onUpArrow",
        Escape: "onEscape",
        Enter: "onEnter"
    }),
    onDownArrow: function() {
        return this.props.onFocusBelow()
    },
    onUpArrow: function() {
        return this.props.onFocusAbove()
    },
    onEscape: function() {
        return this.props.onEscape()
    },
    onEnter: function() {
        return this.props.onSelect(this)
    },
    onClick: function() {
        return this.props.onSelect(this)
    },
    onMouseOver: function(event) {
        return this.props.onBecameFocused(event)
    },
    componentDidUpdate: function() {
        if (this.props.useFocus && this.props.isFocused) {
            return this.getDOMNode().focus()
        }
    },
    render: function() {
        var className = classSet({
            "menu-option": true,
            selected: this.props.isSelected,
            focused: this.props.isFocused
        });
        return React.createElement("div", React.__spread({}, this.props, {
            className: className,
            onKeyDown: this.onKeyDown,
            onClick: this.onClick,
            onMouseOver: this.onMouseOver
        }), this.props.children);
    }
});

module.exports = $Option;