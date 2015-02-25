var React = require("react");

var PropTypes = React.PropTypes;

var $Icon = React.createClass({
    displayName: "Icon",
    propTypes: {
        icon: PropTypes.string.isRequired,
        size: PropTypes.number,
        color: PropTypes.oneOf("babu beach ebisu hackberry kazan lima rausch tirol light-gray dark-gray gray".split(" "))
    },
    render: function() {
        var className = ["icon"].concat(this.props.className || []);
        className.push("icon-" + this.props.icon);
        if (this.props.color) {
            className.push("icon-" + this.props.color)
        }
        if (this.props.size) {
            className.push("icon-size-" + this.props.size)
        }
        return React.createElement("i", {
            className: className.join(" ")
        })
    }
});

module.exports = $Icon