var React = require("react");

var $Section = React.createClass({
    displayName: "Section",
    render: function() {
        return (React.createElement("div", React.__spread({}, this.props, {
            className: "menu-section " + (this.props.className || "")
        }), this.props.children))
    }
});

module.exports = $Section