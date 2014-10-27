/**
 * @providesModule eprintf
 */
var copyProperties = require('./copyProperties.js');

var Env = { start: Date.now() };

if (global.Env) {
    copyProperties(Env, global.Env);
    global.Env = undefined;
}

module.exports = Env;