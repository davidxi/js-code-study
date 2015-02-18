/**
 * @providesModule NotificationTokens
 */
var CurrentUser = require('./CurrentUser');

var NotificationTokens = {
    tokenizeIDs: function(ids) {
        return ids.map(function(id) {
            return CurrentUser.getID() + ':' + id;
        });
    },
    untokenizeIDs: function(ids) {
        return ids.map(function(id) {
            return id.split(':')[1];
        });
    }
};
module.exports = NotificationTokens;