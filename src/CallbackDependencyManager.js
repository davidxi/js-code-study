/**
 * @providesModule CallbackDependencyManager
 */
function DependencyManager() {
    this.dependencyId = 1;
    this.storedDeps = {};
    this.countMap = {};
    this.persistendDepsSatisfied = {};
}

DependencyManager.prototype._markDependencyRelationship = function(depId, names) {
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

DependencyManager.prototype.addDependencyToExistingCallback = function(depId, eventNames) {
    if (!this.storedDeps[depId]) return;
    var refCount = this._markDependencyRelationship(depId, eventNames);
    this.storedDeps[depId].remaingCount += refCount;
};

DependencyManager.prototype.registerCallback = function(callback, eventNames) {
    var token = this.dependencyId++;
    var refCount = this._markDependencyRelationship(token, eventNames);
    if (refCount <= 0) {
        callback();
    } else {
        this.storedDeps[token] = new DependencyTask(callback, refCount);
    }
    return token;
};

DependencyManager.prototype._satisfyDependency = function(name) {
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
            callback();
        }
    }
};

DependencyManager.prototype.isPersistentDependencySatisfied = function(name) {
    return !!this.persistendDepsSatisfied[name];
};

DependencyManager.prototype.satisfyPersistentDependency = function(name) {
    this.persistendDepsSatisfied[name] = true;
    this._satisfyDependency(name);
};

DependencyManager.prototype.unsatisfyPersistentDependency = function(name) {
    delete this.persistendDepsSatisfied[name];
};

DependencyManager.prototype.satisfyNonPersistentDependency = function(name) {
    var isPersistentDependencySatisfied = this.persistendDepsSatisfied[name];
    isPersistentDependencySatisfied || (this.persistendDepsSatisfied[name] = true);
    this._satisfyDependency(name);
    isPersistentDependencySatisfied || (delete this.persistendDepsSatisfied[name]);
};

function DependencyTask(callback, count) {
    this.callback = callback;
    this.remaingCount = count || 0;
}

var klass = new DependencyManager();
klass.__superConstructor__ = DependencyManager;

module.exports = klass;