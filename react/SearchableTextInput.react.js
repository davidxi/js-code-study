/**
 * @providesModule SearchableTextInput.react
 */
var EventListener = require('./EventListener');
var React = require('./React');
var AbstractTextFieldMixin = require('./AbstractTextFieldMixin.react');
var $AbstractTextInput = require('./AbstractTextInput.react');
var getActiveElement = require('./getActiveElement');
var merge = require('./merge');

var $SearchableTextInput = React.createClass({
    displayName: "SearchableTextInput",
    propTypes: merge(AbstractTextFieldMixin.propTypes, {
        queryString: React.PropTypes.string,
        searchSource: React.PropTypes.object,
        searchSourceOptions: React.PropTypes.object,
        onEntriesFound: React.PropTypes.func.isRequired,
        searchOnFocus: React.PropTypes.bool,
        searchOnUpdate: React.PropTypes.bool,
        onPaste: React.PropTypes.func,
        onFocus: React.PropTypes.func,
        onChange: React.PropTypes.func
    }),
    componentDidMount: function() {
        if (this.props.onPaste) {
            this._listener = EventListener.listen(this.refs.input.getTextFieldDOM(), 'paste', this.props.onPaste);
        }
    },
    componentWillReceiveProps: function() {},
    componentDidUpdate: function(prevProps) {
        if (this.props.searchOnUpdate) {
            if (prevProps.queryString !== this.props.queryString) {
                this.search(this.props.queryString);
            }
        }
    },
    componentWillUnmount: function() {
        if (this._listener) {
            this._listener.remove();
            this._listener = null;
        }
    },
    _onInputFocus: function() {
        this.props.searchSource.bootstrap(function() {
            if (this.props.searchOnFocus) {
                this.search(this.props.queryString);
            }
        }.bind(this));
        /*jshint -W030 */
        this.props.onFocus && this.props.onFocus();
        /*jshint +W030 */
    },
    _onSearchCallback: function(matched, queryString) {
        if (this.props.queryString === queryString) { // async
            this.props.onEntriesFound(matched);
        }
    },
    _onChange: function(event) {
        /*jshint -W030 */
        this.props.onChange && this.props.onChange(event);
        /*jshint +W030 */
        var queryValue = event.target.value;
        setTimeout(function() {
            this.search(queryValue);
        }.bind(this));
    },
    search: function(queryString) {
        this.props.searchSource.search(queryString, this._onSearchCallback, this.props.searchSourceOptions);
    },
    focusInput: function() {
        var textFieldNode = this.getTextFieldDOM();
        if (getActiveElement() === textFieldNode) {
            this._onInputFocus();
        } else {
            // 'offsetHeight' = 0 when it is in hidden display
            /*jshint -W030 */
            textFieldNode.offsetHeight && textFieldNode.focus();
            /*jshint +W030 */
        }
    },
    blurInput: function() {
        var textFieldNode = this.getTextFieldDOM();
        // 'offsetHeight' = 0 when it is in hidden display
        /*jshint -W030 */
        textFieldNode.offsetHeight && textFieldNode.blur();
        /*jshint +W030 */
    },
    getTextFieldDOM: function() {
        return this.refs.input.getTextFieldDOM();
    },
    render: function() {
        var queryString = this.props.queryString || '';
        return (React.createElement($AbstractTextInput, React.__spread({}, this.props, {
            "aria-label": queryString,
            onChange: this._onChange,
            onFocus: this._onInputFocus,
            ref: "input",
            role: "combobox",
            value: queryString
        })));
    }
});
module.exports = $SearchableTextInput;