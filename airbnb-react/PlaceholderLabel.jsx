var React = require("react");
var _ = require("underscore");

var isPlaceholderNativeSupport = "placeholder" in document.createElement("input");
var isDevMode = false && window.Airbnb.Utils._isDev;
// i guess 'false' above is filled in during webpack

var PlaceholderLabelFactory = function(inputTag, displayName) {
    return React.createClass({
        displayName: displayName,
        componentWillMount: function() {
            this.needsPlaceholding = isDevMode || this.props.placeholder && !isPlaceholderNativeSupport
        },
        componentWillReceiveProps: function(l) {
            this.needsPlaceholding = isDevMode || l.placeholder && !isPlaceholderNativeSupport
        },
        render: function() {
            var inputProps = isDevMode ?
                              _.omit(this.props, "placeholder") :
                              this.props;
            return React.createElement("span", {
                className: "input-placeholder-group"
            }, this.renderLabel(), React.createElement(inputTag, React.__spread({}, inputProps, {
                ref: "input"
            })))
        },
        getInput: function() {
            return this.refs.input
        },
        getValue: function() {
            try {
                return this.getInput().getDOMNode().value
            } catch (err) {
                return this.props.value || this.props.initialValue
            }
        },
        renderLabel: function() {
            if (this.needsPlaceholding && !this.getValue()) {
                return (React.createElement("label", {
                    className: "input-placeholder-label",
                    htmlFor: this.props.name
                }, this.props.placeholder))
            }
            return null
        }
    })
};
module.exports = {
    Input: PlaceholderLabelFactory("input", "Input"),
    Textarea: PlaceholderLabelFactory("textarea", "Textarea")
}