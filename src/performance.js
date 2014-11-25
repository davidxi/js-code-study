/**
 * @providesModule performance
 */
var ExecutionEnvironment = require('ExecutionEnvironment');
var performance;

if (ExecutionEnvironment.canUseDOM) {
    // http://www.w3.org/TR/2012/REC-navigation-timing-20121217/#sec-window.performance-attribute
    performance = window.performance ||
    			  window.msPerformance ||
    			  window.webkitPerformance;
}
module.exports = performance || {};