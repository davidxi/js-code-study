/**
 * @providesModule CurrentUser
 */
var Cookie = require('./Cookie');
var CurrentUserInitialData = require('./CurrentUserInitialData');

var CurrentUser = {
    getID: function() {
        return CurrentUserInitialData.USER_ID;
    },
    getAccountID: function() {
        return CurrentUserInitialData.ACCOUNT_ID;
    },
    isLoggedIn: function() {
        return CurrentUserInitialData.USER_ID &&
                CurrentUserInitialData.USER_ID !== '0';
    },
    isLoggedInNow: function() {
        if (!CurrentUser.isLoggedIn()) {
            return false;
        }
        if (CurrentUserInitialData.IS_INTERN_SITE) {
            return true;
        }
        if (CurrentUserInitialData.ORIGINAL_USER_ID) {
            return CurrentUserInitialData.ORIGINAL_USER_ID === Cookie.get('c_user');
        }
        return CurrentUserInitialData.USER_ID === Cookie.get('c_user');
    },
    isEmployee: function() {
        return !!CurrentUserInitialData.IS_EMPLOYEE;
    },
    isGray: function() {
        return !!CurrentUserInitialData.IS_GRAY;
    }
};
module.exports = CurrentUser;