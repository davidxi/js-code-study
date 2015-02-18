/**
 * @providesModule ChannelConstants
 */
var prefix = 'channel/';

module.exports = {
    ON_SHUTDOWN: prefix + 'shutdown',
    ON_INVALID_HISTORY: prefix + 'invalid_history',
    ON_CONFIG: prefix + 'config',
    ON_ENTER_STATE: prefix + 'enter_state',
    ON_EXIT_STATE: prefix + 'exit_state',
    ATTEMPT_RECONNECT: prefix + 'attempt_reconnect',
    RTI_SESSION: prefix + 'new_rti_address',
    SKYWALKER: prefix + 'skywalker',
    OK: 'ok',
    ERROR: 'error',
    ERROR_MAX: 'error_max',
    ERROR_MISSING: 'error_missing',
    ERROR_MSG_TYPE: 'error_msg_type',
    ERROR_SHUTDOWN: 'error_shutdown',
    ERROR_STALE: 'error_stale',
    SYS_OWNER: 'sys_owner',
    SYS_NONOWNER: 'sys_nonowner',
    SYS_ONLINE: 'sys_online',
    SYS_OFFLINE: 'sys_offline',
    SYS_TIMETRAVEL: 'sys_timetravel',
    HINT_AUTH: 'shutdown auth',
    HINT_CONN: 'shutdown conn',
    HINT_DISABLED: 'shutdown disabled',
    HINT_INVALID_STATE: 'shutdown invalid state',
    HINT_MAINT: 'shutdown maint',
    HINT_UNSUPPORTED: 'shutdown unsupported',
    reason_Unknown: 0,
    reason_AsyncError: 1,
    reason_TooLong: 2,
    reason_Refresh: 3,
    reason_RefreshDelay: 4,
    reason_UIRestart: 5,
    reason_NeedSeq: 6,
    reason_PrevFailed: 7,
    reason_IFrameLoadGiveUp: 8,
    reason_IFrameLoadRetry: 9,
    reason_IFrameLoadRetryWorked: 10,
    reason_PageTransitionRetry: 11,
    reason_IFrameLoadMaxSubdomain: 12,
    reason_NoChannelInfo: 13,
    reason_NoChannelHost: 14,
    CAPABILITY_VOIP_INTEROP: 8,
    CAPABILITY_VIDEO: 32,
    FANTAIL_DEBUG: 'DEBUG',
    FANTAIL_WARN: 'WARN',
    FANTAIL_INFO: 'INFO',
    FANTAIL_ERROR: 'ERROR',
    SUBSCRIBE: 'subscribe',
    UNSUBSCRIBE: 'unsubscribe',
    getArbiterType: function(type) {
        return prefix + 'message:' + type;
    },
    getSkywalkerArbiterType: function(type) {
        return prefix + 'skywalker:' + type;
    }
};