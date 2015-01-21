/**
 * @providesModule Grid.react
 */
var React = require('./React');
var ReactChildren = require('./ReactChildren');
var ReactElement = require('./ReactElement');
var joinClasses = require('./joinClasses');

var PropTypes = React.PropTypes;
var GridItem;
var Grid = React.createClass({
    displayName: "Grid",
    propTypes: {
        cols: PropTypes.number.isRequired,
        fixed: PropTypes.bool,
        alignv: PropTypes.oneOf(['top', 'middle', 'bottom']),
        alignh: PropTypes.oneOf(['left', 'center', 'right']),
        spacing: PropTypes.string
    },
    render: function() {
        var props = this.props,
            alignh = props.alignh,
            alignv = props.alignv,
            children = props.children,
            cols = props.cols,
            fixed = props.fixed,
            spacing = props.spacing,
            // https://github.com/facebook/react/blob/54c82da15f6b4717425edbf68e23ae82583a50af/src/utils/traverseAllChildren.js#L89
            childrenCount = ReactChildren.count(children),
            rowElms = [],
            columnElms = [],
            colCount = 0;
        ReactChildren.forEach(children, function(child, childIndex) {
            if (child === null || child === undefined) {
                return;
            }
            var isGridItemElement = child.type === GridItem.type;
            colCount += isGridItemElement ? Math.max(child.props.colSpan || 0, 1) : 1;
            var childPropsInherit = {
                alignh: alignh,
                alignv: alignv,
/*
._51mz ._51mw { padding-right: 0 }
*/
                className: joinClasses(child.props.className, spacing, ((colCount === cols ? "_51mw" : '')))
            };
            if (!isGridItemElement) {
                child = React.createElement(GridItem, React.__spread({}, childPropsInherit), child);
            } else {
                // https://github.com/facebook/react/blob/8d5838af728a425ca17595c074b6d3ef16015eda/src/classic/element/ReactElement.js#L213
                child = ReactElement.cloneAndReplaceProps(child, Object.assign({}, childPropsInherit, child.props));
            }
            columnElms.push(child);
            if (colCount % cols === 0 || childIndex + 1 === childrenCount) {
                if (fixed && colCount < cols) {
                    for (var da = colCount; da < cols; da++) {
                        columnElms.push(React.createElement(GridItem, null));
                    }
                    colCount = cols; // @todo: since 'colCount' will be set to be 0 soon below, what's the purpose to set to be 'cols' here ?
                }
/*
._51mx:first-child>._51m- {
    padding-top: 0
}

._51mx:last-child>._51m- {
    padding-bottom: 0
}
*/
                rowElms.push(React.createElement("tr", {
                    className: "_51mx",
                    key: childIndex
                }, columnElms));
                columnElms = [];
                colCount = 0;
            }
        }); /* ./ ReactChildren.forEach(children) */
        return (React.createElement("table", React.__spread({}, this.props, {
            className: joinClasses(this.props.className, (("uiGrid") + (' ' + "_51mz") + (fixed ? ' ' + "_5f0n" : ''))),
/*
._51mz {
    border: 0;
    border-collapse: collapse;
    border-spacing: 0
}
._5f0n {
    table-layout: fixed;
    width: 100%
}
*/
            cellSpacing: "0",
            cellPadding: "0"
        }), React.createElement("tbody", null, rowElms)));
    }
});
GridItem = React.createClass({
    displayName: "GridItem",
    propTypes: {
        alignv: PropTypes.oneOf(['top', 'middle', 'bottom']),
        alignh: PropTypes.oneOf(['left', 'center', 'right'])
    },
    render: function() {
/*
.uiGrid .vTop {
    vertical-align: top
}

.uiGrid .vMid {
    vertical-align: middle
}

.uiGrid .vBot {
    vertical-align: bottom
}

.uiGrid .hLeft {
    text-align: left
}

.uiGrid .hCent {
    text-align: center
}

.uiGrid .hRght {
    text-align: right
}
*/
        var className = joinClasses(this.props.className, (("_51m-") + (this.props.alignv === 'top' ? ' ' + "vTop" : '') + (this.props.alignv === 'middle' ? ' ' + "vMid" : '') + (this.props.alignv === 'bottom' ? ' ' + "vBot" : '') + (this.props.alignh === 'left' ? ' ' + "hLeft" : '') + (this.props.alignh === 'center' ? ' ' + "hCent" : '') + (this.props.alignh === 'right' ? ' ' + "hRght" : '')));
        return (React.createElement("td", React.__spread({}, this.props, {
            className: className
        })));
    }
});
Grid.GridItem = GridItem;
module.exports = Grid;