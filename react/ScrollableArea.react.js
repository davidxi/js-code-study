/**
 * @providesModule ScrollableArea.react
 */
var Bootloader = require('./Bootloader');
var React = require('./React');
var Style = require('./Style');
var joinClasses = require('./joinClasses');

require('./Scrollable');

var $ScrollableArea = React.createClass({
    displayName: "ReactScrollableArea",
    propTypes: {
        width: React.PropTypes.number,
        height: React.PropTypes.oneOfType([React.PropTypes.number, React.PropTypes.string]),
        onScroll: React.PropTypes.func,
        shadow: React.PropTypes.bool,
        fade: React.PropTypes.bool,
        persistent: React.PropTypes.bool
    },
    render: function() {
        var containerStyle = {
            height: this.props.height
        };
        return (React.createElement("div", React.__spread({}, this.props, {
            className: joinClasses(this.props.className, 'uiScrollableArea native'),
            ref: "root",
            style: Object.assign({}, (this.props.style || {}), containerStyle)
        }), React.createElement("div", {
            className: "uiScrollableAreaWrap scrollable",
            ref: "wrap"
        }, React.createElement("div", {
            className: 'uiScrollableAreaBody',
            ref: "body"
        }, React.createElement("div", {
            className: 'uiScrollableAreaContent'
        }, this.props.children)))));
    },
    getArea: function() {
        return this._area;
    },
    componentDidMount: function() {
        Bootloader.loadModules(["ScrollableArea"], this._loadScrollableArea);
    },
    componentDidUpdate: function(prevProps) {
        if (prevProps.width !== this.props.width) {
            this._setWidthFromProps();
            var scrollAreaInstance = this.getArea();
            scrollAreaInstance.setScrollTop(scrollAreaInstance.getScrollHeight(), false);
        }
    },
    _loadScrollableArea: function(scrollAreaInstance) {
        this._area = scrollAreaInstance.fromNative(this.refs.root.getDOMNode(), {
            fade: this.props.fade,
            persistent: this.props.persistent,
            shadow: this.props.shadow === undefined ? true : this.props.shadow
        });
        this._setWidthFromProps();
        if (this.props.onScroll) {
            this._area.subscribe('scroll', this.props.onScroll);
        }
    },
    _setWidthFromProps: function() {
        var scrollAreaBodyNode = this.refs.body.getDOMNode();
        Style.set(scrollAreaBodyNode, 'width', this.props.width + 'px');
    }
});
module.exports = $ScrollableArea;