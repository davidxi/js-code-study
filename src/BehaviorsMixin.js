/**
 * @providesModule BehaviorsMixin
 */
var copyProperties = require('./copyProperties');

function BehaviorSubscription(behaviorInstance) {
    this._behavior = behaviorInstance;
    this._enabled = false;
}
copyProperties(BehaviorSubscription.prototype, {
    enable: function() {
        if (!this._enabled) {
            this._enabled = true;
            this._behavior.enable();
        }
    },
    disable: function() {
        if (this._enabled) {
            this._enabled = false;
            this._behavior.disable();
        }
    }
});

var uid = 1;
function markBehaviorId(l) {
    if (!l.__BEHAVIOR_ID) {
        l.__BEHAVIOR_ID = uid++;
    }
    return l.__BEHAVIOR_ID;
}

var BehaviorsMixin = {
    enableBehavior: function(BehaviorConstructor) {
        if (!this._behaviors) {
            this._behaviors = {};
        }
        var id = markBehaviorId(BehaviorConstructor);
        if (!this._behaviors[id]) {
            this._behaviors[id] = new BehaviorSubscription(new BehaviorConstructor(this));
        }
        this._behaviors[id].enable();
        return this;
    },
    disableBehavior: function(BehaviorConstructor) {
        if (this._behaviors) {
            var id = markBehaviorId(BehaviorConstructor);
            if (this._behaviors[id]) {
                this._behaviors[id].disable();
            }
        }
        return this;
    },
    enableBehaviors: function(BehaviorConstructors) {
        BehaviorConstructors.forEach(this.enableBehavior.bind(this));
        return this;
    },
    destroyBehaviors: function() {
        if (this._behaviors) {
            for (var id in this._behaviors) {
                this._behaviors[id].disable();
            }
            this._behaviors = {};
        }
    },
    hasBehavior: function(BehaviorConstructor) {
        return this._behaviors && (markBehaviorId(BehaviorConstructor) in this._behaviors);
    }
};
module.exports = BehaviorsMixin;