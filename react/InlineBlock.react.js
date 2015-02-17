/**
 * @providesModule InlineBlock.react
 */
/* jshint eqnull: true */
var React = require('./React');
var joinClasses = require('./joinClasses');

var alignvClassNames = {
    baseline: null,
    bottom: "_6d",
    middle: "_6b",
    top: "_6e"
};
/*
._6d {
    vertical-align: bottom
}
._6b {
    vertical-align: middle
}
._6e {
    vertical-align: top
}
*/

var $InlineBlock = React.createClass({
    displayName: "InlineBlock",
    propTypes: {
        alignv: React.PropTypes.oneOf(['baseline', 'bottom', 'middle', 'top']),
        height: React.PropTypes.number,
        fullWidth: React.PropTypes.bool
    },
    getDefaultProps: function() {
        return {
            alignv: 'baseline',
            fullWidth: false
        };
    },
    render: function() {
        var alignvClassName = alignvClassNames[this.props.alignv];
        /*
        ._6a {
            display: inline-block
        }
        */
        var inlineClassName = "_6a";
        if (this.props.fullWidth) {
            /*
            ._5u5j {
                width: 100%
            }
            */
            inlineClassName = joinClasses(inlineClassName, "_5u5j");
        }
        var contentClassName = joinClasses(inlineClassName, alignvClassName);
        var children = null;

        if (this.props.height != null) {
            var fixedHeightDiv = React.createElement("div", {
                className: joinClasses("_6a", alignvClassName),
                style: {
                    height: this.props.height + 'px'
                }
            });

            children = [
                fixedHeightDiv,
                React.createElement("div", {
                    className: contentClassName
                }, this.props.children)
            ];

            return React.createElement("div", React.__spread({}, this.props, {
                className: joinClasses(this.props.className, inlineClassName),
                height: null
            }), children);

        } else {

            children = this.props.children;
            return React.createElement("div", React.__spread({}, this.props, {
                className: joinClasses(this.props.className, contentClassName)
            }), children);
        }
    }
});
module.exports = $InlineBlock;