/**
 * @providesModule CallbackDependencyManager
 */
var ErrorUtils = require('./ErrorUtils');

function CallbackDependencyManager() {
    this.dependencyId = 1;
    this.storedDeps = {};
    this.countMap = {};
    this.persistendDepsSatisfied = {};
}

CallbackDependencyManager.prototype._markDependencyRelationship = function(depId, names) {
    var affected = 0,
        involved = {},
        i = names.length;
    while (i--) {
        involved[names[i]] = true;
    }
    Object.keys(involved).forEach(function(name) {
        if (this.persistendDepsSatisfied[name]) return;
        affected++;
        this.countMap[name] || (this.countMap[name] = {});
        this.countMap[name][depId] = (this.countMap[name][depId] || 0) + 1;
    }.bind(this));
    return affected;
};

CallbackDependencyManager.prototype.addDependencyToExistingCallback = function(depId, eventNames) {
    if (!this.storedDeps[depId]) return;
    var refCount = this._markDependencyRelationship(depId, eventNames);
    this.storedDeps[depId].remaingCount += refCount;
};

CallbackDependencyManager.prototype.registerCallback = function(callback, eventNames) {
    var token = this.dependencyId++;
    var refCount = this._markDependencyRelationship(token, eventNames);
    if (refCount <= 0) {
        ErrorUtils.applyWithGuard(callback);
        return null;
    }
    this.storedDeps[token] = new CallbackDependencyTask(callback, refCount);
    return token;
};

CallbackDependencyManager.prototype._satisfyDependency = function(name) {
    if (!this.countMap[name]) return; // event not registered to track
    for (var depId in this.countMap[name]) {

        this.countMap[name][depId] --; // ref--
        if (this.countMap[name][depId] <= 0) {
            delete this.countMap[name][depId];
        }

        this.storedDeps[depId].remaingCount--;
        if (this.storedDeps[depId].remaingCount <= 0) {
            var callback = this.storedDeps[depId].callback;
            delete this.storedDeps[depId]; // avoid multiple invoke callback
            ErrorUtils.applyWithGuard(callback);
        }
    }
};

CallbackDependencyManager.prototype.isPersistentDependencySatisfied = function(name) {
    return !!this.persistendDepsSatisfied[name];
};

CallbackDependencyManager.prototype.satisfyPersistentDependency = function(name) {
    this.persistendDepsSatisfied[name] = true;
    this._satisfyDependency(name);
};

CallbackDependencyManager.prototype.unsatisfyPersistentDependency = function(name) {
    delete this.persistendDepsSatisfied[name];
};

CallbackDependencyManager.prototype.satisfyNonPersistentDependency = function(name) {
    var isPersistentDependencySatisfied = this.persistendDepsSatisfied[name];
    isPersistentDependencySatisfied || (this.persistendDepsSatisfied[name] = true);
    this._satisfyDependency(name);
    isPersistentDependencySatisfied || (delete this.persistendDepsSatisfied[name]);
};

function CallbackDependencyTask(callback, count) {
    this.callback = callback;
    this.remaingCount = count || 0;
}

module.exports = CallbackDependencyManager;