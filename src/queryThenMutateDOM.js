/**
 * @providesModule queryThenMutateDOM
 */
var Run = require('./Run');
var createArrayFromMixed = require('./createArrayFromMixed');
var emptyFunction = require('./emptyFunction');
var requestAnimationFrame = require('./requestAnimationFrame');

var hasSetupTeardown;
var inCycle;
var locks = {};
var mutateFnQueue = [];
var queryFnQueue = [];

function queryThenMutateDOM(queryFn, mutateFn, lockInCycle /*string id*/ ) {
    if (!queryFn && !mutateFn) {
        return;
    }
    if (lockInCycle && locks.hasOwnProperty(lockInCycle)) {
        return;
    } else if (lockInCycle) {
        locks[lockInCycle] = 1;
    }

    queryFnQueue.push(queryFn || emptyFunction);
    mutateFnQueue.push(mutateFn || emptyFunction);

    startCycle();

    if (!hasSetupTeardown) {
        hasSetupTeardown = true;
        Run.onLeave(function() {
            hasSetupTeardown = false;
            inCycle = false;
            locks = {};
            mutateFnQueue.length = 0;
            queryFnQueue.length = 0;
        });
    }
}
queryThenMutateDOM.prepare = function(queryFn, mutateFn, lockInCycle) {
    return function() {
        var args = createArrayFromMixed(arguments);
        var queryFnBound = Function.prototype.bind.apply(queryFn, [this].concat(args));
        var mutateFnBound = mutateFn.bind(this);
        queryThenMutateDOM(queryFnBound, mutateFnBound, lockInCycle);
    };
};

function processCycle() {
    locks = {};
    var queryFnQueueLen = queryFnQueue.length;
    var mutateFnQueueLen = mutateFnQueue.length;
    var queriedResults = [];
    var fn;
    while (queryFnQueueLen--) {
        fn = queryFnQueue.shift();
        queriedResults.push(fn());
    }
    while (mutateFnQueueLen--) {
        fn = mutateFnQueue.shift();
        fn(queriedResults.shift());
    }
    inCycle = false;
    // in case between 2 while, there are new queryFn/mutateFn pushed in
    startCycle();
}

function startCycle() {
    if (!inCycle && (queryFnQueue.length || mutateFnQueue.length)) {
        inCycle = true;
        requestAnimationFrame(processCycle);
    }
}
module.exports = queryThenMutateDOM;