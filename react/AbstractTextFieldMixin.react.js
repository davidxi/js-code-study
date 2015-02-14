/**
 * @providesModule AbstractTextFieldMixin.react
 */
/*jshint eqnull:true */
var React = require('./React');
var Keys = require('./Keys');
var invariant = require('./invariant');
var joinClasses = require('./joinClasses');
// function cloneWithProps(child/*ReactElement*/, props/*object*/) /*ReactElement*/
//  Sometimes you want to change the props of a child passed to you. Usually  this is to add a CSS class.
var cloneWithProps = require('./cloneWithProps');

var AbstractTextFieldMixin = {
    propTypes: {
        value: React.PropTypes.string,
        placeholder: React.PropTypes.string,
        tabIndex: React.PropTypes.string,
        maxLength: React.PropTypes.number,
        autoComplete: React.PropTypes.string,
        onBackspace: React.PropTypes.func,
        onBackTab: React.PropTypes.func,
        onBlur: React.PropTypes.func,
        onChange: React.PropTypes.func,
        onDownArrow: React.PropTypes.func,
        onEnter: React.PropTypes.func,
        onEscape: React.PropTypes.func,
        onFocus: React.PropTypes.func,
        onKeyDown: React.PropTypes.func,
        onLeftArrow: React.PropTypes.func,
        onNoShiftEnter: React.PropTypes.func,
        onRightArrow: React.PropTypes.func,
        onShiftEnter: React.PropTypes.func,
        onShiftDownArrow: React.PropTypes.func,
        onShiftUpArrow: React.PropTypes.func,
        onTab: React.PropTypes.func,
        onUpArrow: React.PropTypes.func,
        type: React.PropTypes.string,
        autoCapitalize: React.PropTypes.string,
        autoCorrect: React.PropTypes.string
    },
    getInitialState: function() {
        return {
            focused: false,
            value: this.props.defaultValue || ''
        };
    },
    getValue: function() {
        return this.props.value != null ?
            this.props.value :
            this.state.value;
    },
    onInputKeyDown: function(event) {
        var props = this.props;
        var keyCode = event.keyCode;
        var withShiftKey = event.shiftKey;
        if (keyCode === Keys.BACKSPACE && !withShiftKey && props.onBackspace) {
            props.onBackspace(event);
        } else if (keyCode === Keys.TAB && !withShiftKey && props.onTab) {
            props.onTab(event);
        } else if (keyCode === Keys.TAB && withShiftKey && props.onBackTab) {
            props.onBackTab(event);
        } else if (keyCode === Keys.UP) {
            if (withShiftKey) {
                if (props.onShiftUpArrow) {
                    props.onShiftUpArrowAttempt(event);
                }
            } else if (props.onUpArrow) {
                props.onUpArrow(event);
            }
        } else if (keyCode === Keys.DOWN && props.onDownArrow) {
            if (withShiftKey) {
                if (props.onShiftDownArrow) {
                    props.onShiftDownArrow(event);
                }
            } else if (props.onDownArrow) {
                props.onDownArrow(event);
            }
        } else if (keyCode === Keys.LEFT && props.onLeftArrow) {
            props.onLeftArrow(event);
        } else if (keyCode === Keys.RIGHT && props.onRightArrow) {
            props.onRightArrow(event);
        } else if (keyCode === Keys.RETURN) {
            if (props.onEnter) {
                props.onEnter(event);
            }
            if (withShiftKey) {
                if (props.onShiftEnter) {
                    props.onShiftEnter(event);
                }
            } else if (props.onNoShiftEnter) {
                props.onNoShiftEnter(event);
            }
        } else if (keyCode === Keys.ESC && props.onEscape) {
            props.onEscape(event);
        }
        if (props.onKeyDown) {
            props.onKeyDown(event);
        }
    },
    onInputChange: function(event) {
        if (this.props.onChange) {
            this.props.onChange(event);
        }
        if (this.props.value == null) {
            this.setState({
                value: event.target.value
            });
        }
    },
    focusInput: function() {
        this.getTextFieldDOM().focus();
    },
    blurInput: function() {
        this.getTextFieldDOM().blur();
    },
    onInputBlur: function(event) {
        if (this.props.onBlur) {
            this.props.onBlur(event);
        }
        if (!event.isDefaultPrevented()) {
            this.setState({
                focused: false
            });
        }
    },
    onInputFocus: function(event) {
        if (this.props.onFocus) {
            this.props.onFocus(event);
        }
        if (!event.isDefaultPrevented()) {
            this.setState({
                focused: true
            });
        }
    },
    getTextFieldDOM: function() {
        return this.refs[this.getTextFieldRef()].getDOMNode();
    },
    getTextFieldRef: function() {
        return 'textField';
    },
    setTextFieldPropsOn: function(textFieldElem) {
        return cloneWithProps(textFieldElem, {
            'aria-activedescendant': this.props['aria-activedescendant'],
            'aria-autocomplete': this.props['aria-autocomplete'],
            'aria-owns': this.props['aria-owns'],
            'data-testid': this.props['data-testid'],
            ref: this.getTextFieldRef(),
            role: this.props.role,
            autoCapitalize: this.props.autoCapitalize,
            autoComplete: this.props.autoComplete,
            autoCorrect: this.props.autoCorrect,
            onKeyDown: this.onInputKeyDown,
            onBlur: this.onInputBlur,
            onFocus: this.onInputFocus,
            onChange: this.onInputChange,
            disabled: this.props.disabled,
            defaultValue: this.props.defaultValue,
            name: this.props.name,
            value: this.getValue(),
            id: this.props.id,
            maxLength: this.props.maxLength,
            min: this.props.min,
            max: this.props.max,
            title: this.props.title,
            type: this.props.type || textFieldElem.props.type
        });
    },
    render: function() {
        var placeholderElem = null;
        var className;
        if (!this.getValue()) {
/*
._58ai {
    color: #777;
    padding-left: 2px;
    pointer-events: none;
    position: absolute
}
._58aj {
    color: #aaa
}
*/
            className = (("_58ai") + (this.state.focused ? ' ' + "_58aj" : ''));
            placeholderElem = React.createElement("span", {
                className: className
            }, this.props.placeholder);
        }
/*
._58ak {
    border: 1px solid #bdc7d8;
    -webkit-box-sizing: border-box;
    cursor: default;
    display: inline-block;
    font-weight: normal;
    margin: 0;
    position: relative;
    vertical-align: middle
}
*/
        className = joinClasses(this.props.className, "_58ak");
        invariant(this.renderTextField);
        return (React.createElement("label", {
            className: className
        }, {
            placeholder: placeholderElem,
            textField: this.renderTextField()
        }));
    }
};
module.exports = AbstractTextFieldMixin;