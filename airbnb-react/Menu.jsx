var React = require("react");
var $Option = require("./Option.jsx");
var $Section = require("./Section.jsx");
var PropTypes = React.PropTypes;

var noop = function() {};

function CachedValue(val) {
    this.set(val)
}
CachedValue.prototype.get = function() {
    return this._value
};
CachedValue.prototype.set = function(val) {
    this._value = val
};

function isComponentFactory(Component) {
    return function(q) {
        return q && (q.type === Component.type || q.constructor === Component.type)
    }
}
var isSectionComponent = isComponentFactory($Section);
var isOptionComponent = isComponentFactory($Option);

function countOptionComponents(children, callbackOnOption, currentCount) {
    currentCount = currentCount || 0;
    React.Children.forEach(children, function(child) {
        if (isOptionComponent(child)) {
            callbackOnOption(child, currentCount);
            currentCount++;
            return
        }
        if (isSectionComponent(child)) {
            currentCount += countOptionComponents(child.props.children, callbackOnOption, currentCount)
        }
    });
    return currentCount
}

var $Menu = React.createClass({
    displayName: "Menu",
    propTypes: {
        useFocus: PropTypes.bool,
        onPassEnd: PropTypes.func,
        onPassStart: PropTypes.func,
        onSelect: PropTypes.func,
        onEscape: PropTypes.func,
        onFocusIndex: PropTypes.func,
    },
    getInitialState: function() {
        return {
            focusedIndex: NaN,
            selectedIndex: NaN
        }
    },
    getDefaultProps: function() {
        return {
            useFocus: false,
            onPassEnd: noop,
            onPassStart: noop,
            onSelect: noop,
            onEscape: noop,
            onFocusIndex: noop
        }
    },
    focusNext: function() {
        if (isNaN(this.state.focusedIndex)) {
            return this.setIndex(0)
        }
        return this.setIndex(this.state.focusedIndex + 1)
    },
    focusPrev: function() {
        if (isNaN(this.state.focusedIndex)) {
            return this.setIndex(this.getMaxIndex())
        }
        return this.setIndex(this.state.focusedIndex - 1)
    },
    focusIndex: function(p) {
        return this.setIndex(p)
    },
    clearFocused: function() {
        return this.setIndex(NaN)
    },
    focus: function() {
        if (!this.props.useFocus) {
            return
        }
        if (isNaN(this.state.focusedIndex)) {
            return this.focusNext()
        }
        var optionFocused = this.getFocusedOption();
        if (optionFocused) {
            return optionFocused.getDOMNode().focus()
        }
    },
    selectIndex: function(p) {
        this.setIndex(p, function() {
            this.selectFocused()
        }.bind(this))
    },
    selectFocused: function() {
        this.childSelected(this.state.focusedIndex, this.refs.focused)
    },
    clearSelected: function() {
        this.setState({
            selectedIndex: NaN
        })
    },
    getSelectedOption: function() {
        if (this.state.focusedIndex === this.state.selectedIndex) {
            return this.refs.focused
        }
        return this.refs.selected
    },
    getFocusedOption: function() {
        return this.refs.focused
    },
    getOptionCount: function() {
        return this.state.optionCount
    },
    forEachOption: function(callback) {
        return countOptionComponents(this.props.children, callback)
    },
    addOptionHandlers: function(props, index) /*object*/{
        props.onFocusAbove = this.focusPrev;
        props.onFocusBelow = this.focusNext;
        props.onSelect = this.childSelected.bind(this, index);
        props.onEscape = this.childEscape.bind(this, index);
        props.onBecameFocused = this.setIndex.bind(this, index, undefined);
        if (!this.props.useFocus) {
            props.onMouseDown = function(event) {
                event.preventDefault();
                event.target.unselectable = true
            }
        }
    },
    childSelected: function(focusedIndex, optionFocused/*component*/) {
        this.setState({
            selectedIndex: focusedIndex
        });
        return this.props.onSelect(focusedIndex, optionFocused)
    },
    childEscape: function(focusedIndex) {
        this.setIndex(NaN);
        return this.props.onEscape(focusedIndex)
    },
    getMaxIndex: function() {
        return this.getOptionCount() - 1
    },
    setIndex: function(index, callback) {
        var firstIndex = 0;
        var lastIndex = this.getMaxIndex();

        // circular
        if (index < firstIndex) {
            this.setIndex(lastIndex, this.props.onPassStart);
            return
        }
        if (index > lastIndex) {
            this.setIndex(firstIndex, this.props.onPassEnd);
            return
        }

        callback = callback || noop;

        return this.setState({
            focusedIndex: index
        }, function() {
            this.props.onFocusIndex(index);
            callback()
        }.bind(this))
    },
    cloneOption: function(optionComponent, cachedValue) {
        var index = cachedValue.get();
        cachedValue.set(index + 1);
        var props = {
            isFocused: this.state.focusedIndex === index,
            isSelected: this.state.selectedIndex === index,
            useFocus: this.props.useFocus,
            key: optionComponent.props.key || optionComponent.key,
        };
        if (props.isSelected) {
            props.ref = "selected"
        }
        if (props.isFocused) {
            props.ref = "focused"
        }
        if (this.props.useFocus) {
            props.tabIndex = "-1"
        }
        this.addOptionHandlers(props, index);
        return React.addons.cloneWithProps(optionComponent, props)
    },
    cloneSection: function(sectionComponent, cachedValue) {
        var children = React.Children.map(sectionComponent.props.children, function(child) {
            if (isSectionComponent(child)) {
                return this.cloneSection(child, cachedValue)
            }
            if (isOptionComponent(child)) {
                return this.cloneOption(child, cachedValue)
            }
            return child
        }.bind(this));

        return React.addons.cloneWithProps(sectionComponent, {
            children: children
        })
    },
    render: function() {
        var sections = this.cloneSection(React.createElement($Section, null, this.props.children), new CachedValue(0));

        return (React.createElement("div", React.__spread({}, this.props, {
            className: "menu " + (this.props.className || ""),
            "aria-role": "listbox"
        }), sections))
    },
    componentWillReceiveProps: function(nextProps) {
        this.setState({
            optionCount: countOptionComponents(nextProps.children, noop),
        })
    }
});

module.exports = $Menu