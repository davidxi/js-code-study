/**
 * @providesModule Timestamp.react
 */
var LiveTimer = require('./LiveTimer');
var joinClasses = require('./joinClasses');
var React = require('./React');

var $Timestamp = React.createClass({
    displayName: "Timestamp",
    propTypes: {
        autoUpdate: React.PropTypes.bool
    },
    getDefaultProps: function() {
        return {
            autoUpdate: false
        };
    },
    componentDidMount: function() {
        if (this.props.autoUpdate) {
            LiveTimer.addTimeStamps(this.getDOMNode());
        }
    },
    componentDidUpdate: function(prevProps) {
        if (this.props.autoUpdate && this.props.time !== prevProps.time) {
            LiveTimer.loop();
        }
    },
    render: function() {
        var label = LiveTimer.renderRelativeTimeToServer(this.props.time, this.props.shorten);
        var props = React.__spread({}, this.props, {
            className: joinClasses(this.props.className, "livetimestamp"),
            title: this.props.verbose,
            "data-utime": this.props.time,
            "data-shorten": this.props.shorten ? true : null
        });
        return React.createElement("abbr", props, label.text || this.props.text);
    }
});
module.exports = $Timestamp;