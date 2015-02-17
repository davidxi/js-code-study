/**
 * @providesModule AbstractTextInput.react
 */
var AbstractTextFieldMixin = require('./AbstractTextFieldMixin.react');
var React = require('./React');

var $AbstractTextInput = React.createClass({
    displayName: "AbstractTextInput",
    mixins: [AbstractTextFieldMixin],
    renderTextField: function() {
        return this.setTextFieldPropsOn(React.createElement("input", {
            type: "text",
            /*
            ._58al {
                background: transparent;
                border: 0;
                margin: 0;
                outline: 0;
                padding: 0;
                width: 100%
            }
            */
            className: "_58al",
            size: this.props.size,
            tabIndex: this.props.tabIndex,
            onClick: this.props.onClick,
            onKeyUp: this.props.onKeyUp,
            onPaste: this.props.onPaste
        }));
    }
});
module.exports = $AbstractTextInput;