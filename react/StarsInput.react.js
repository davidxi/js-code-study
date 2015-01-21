/**
 * @providesModule StarsInput.react
 */
var React = require('./React');
var TooltipLink = require('./TooltipLink.react');

var StarsInput = React.createClass({
    displayName: "StarsInput",
    propTypes: {
        allowMultipleSubmissions: React.PropTypes.bool,
        onClick: React.PropTypes.func.isRequired,
        starLabels: React.PropTypes.array
    },
    getDefaultProps: function() {
        return {
            allowMultipleSubmissions: false,
            starLabels: ["Poor", "Fair", "Good", "Very Good", "Excellent"]
        };
    },
    getInitialState: function() {
        return {
            starRating: 0,
            starsShown: 0,
            canUpdate: true
        };
    },
    _getStarRating: function(l) {
        return parseInt(l.split('.').pop(), 10) + 1;
    },
    onMouseEnter: function(event) {
        if (this.state.canUpdate) {
            this.setState({
                // @todo: in which module is 'dispatchMarker' added to event ?
                starsShown: this._getStarRating(event.dispatchMarker)
            });
        }
    },
    onMouseLeave: function() {
        if (this.state.canUpdate) {
            var starRating = this.state.starRating;
            this.setState({
                starsShown: starRating
            });
        }
    },
    onClick: function(event) {
        if (this.state.canUpdate) {
            var starRating = this._getStarRating(event.dispatchMarker);
            this.setState({
                starRating: starRating,
                starsShown: starRating,
                canUpdate: this.props.allowMultipleSubmissions
            });
            this.props.onClick(starRating);
        }
    },
    getStars: function() {
        var labelsLen = this.props.starLabels.length,
            starElms = [];
        for (var n = 0; n < labelsLen; n++) {
            starElms.push(React.createElement(TooltipLink, {
/*
.mls {
    margin-left: 5px
}
.mlm {
    margin-left: 10px
}
.mll {
    margin-left: 20px
}
._22mm {
    cursor: pointer;
    display: inline-block;
    height: 13px;
    width: 13px
}
*/
                className: (("mls") + (' ' + "_22mm") + (n >= this.state.starsShown ? ' ' + "_22mn" : '') + (n < this.state.starsShown ? ' ' + "_22mo" : '') + (!this.state.canUpdate ? ' ' + "_1g87" : '')),
                // @todo: 'n >= starsShown' and 'n < starsShown' both ?
                tooltip: this.props.starLabels[n],
                onMouseEnter: this.onMouseEnter,
                onMouseLeave: this.onMouseLeave,
                onClick: this.onClick,
                position: "above",
                alignH: "center"
            }));
        }
        return starElms;
    },
    render: function() {
        return (React.createElement("div", null, this.getStars()));
    }
});
module.exports = StarsInput;