/**
 * @providesModule TooltipLink.react
 */
var React = require('./React');
var TooltipMixin = require('./TooltipMixin');

var $TooltipLink = React.createClass({
    displayName: "TooltipLink",
    mixins: [TooltipMixin],
    render: function() {
        return React.createElement("a", React.__spread({}, this.props), this.props.children);
    }
});
module.exports = $TooltipLink;