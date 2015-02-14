/**
 * @providesModule TooltipMixin
 */
/*jshint eqnull:true */
var React = require('./React');
var Tooltip = require('./Tooltip');
var DOM = require('./DOM');

function isUseTooltip(props) {
    var m = props.tooltip;
    return m != null && typeof m !== 'string';
}
var TooltipMixin = {
    propTypes: {
        tooltip: React.PropTypes.oneOfType([React.PropTypes.element, React.PropTypes.string]),
        position: React.PropTypes.oneOf(['above', 'below', 'left', 'right']),
        alignH: React.PropTypes.oneOf(['left', 'center', 'right'])
    },
    getInitialState: function() {
        return {
            tooltipContainer: isUseTooltip(this.props) ? DOM.create('div') : null
        };
    },
    componentWillReceiveProps: function(nextProps) {
        var useTooltip = isUseTooltip(nextProps);
        var tooltipContainer = this.state.tooltipContainer;
        if (tooltipContainer && !useTooltip) {
            this.setState({
                tooltipContainer: null
            });
        } else if (!tooltipContainer && useTooltip) {
            this.setState({
                tooltipContainer: DOM.create('div')
            });
        }
    },
    componentDidMount: function() {
        this._updateTooltip();
    },
    componentDidUpdate: function(prevProps, prevState) {
        if (prevState.tooltipContainer && !this.state.tooltipContainer) {
            this._cleanupContainer(prevState.tooltipContainer);
        }
        this._updateTooltip();
    },
    _updateTooltip: function() {
        var tooltipContainer;
        if (isUseTooltip(this.props)) {
            tooltipContainer = this.state.tooltipContainer;
            React.render(this.props.tooltip, tooltipContainer);
        } else {
            tooltipContainer = this.props.tooltip;
        }
        if (tooltipContainer != null) {
            Tooltip.set(this.getDOMNode(), tooltipContainer, this.props.position, this.props.alignH);
        } else {
            Tooltip.remove(this.getDOMNode());
        }
    },
    componentWillUnmount: function() {
        if (this.state.tooltipContainer) {
            this._cleanupContainer(this.state.tooltipContainer);
        }
        Tooltip.remove(this.getDOMNode());
    },
    _cleanupContainer: function(tooltipContainer) {
        React.unmountComponentAtNode(tooltipContainer);
    }
};
module.exports = TooltipMixin;