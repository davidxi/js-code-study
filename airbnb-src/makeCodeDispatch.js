function makeCodeDispatcher(handlersMapping, isPreventDefault) {
    if (isPreventDefault == null) {
        isPreventDefault = true
    }
    return function(event) {
        var handler = handlersMapping[event.keyCode] || handlersMapping[keyCodeMapping[event.keyCode]];
        if (!handler) {
            return
        }
        if (isPreventDefault) {
            event.preventDefault()
        }
        if (typeof handler === "function") {
            return handler(event)
        } else {
            return this[handler](event)
        }
    }
}
var keyCodeMapping = {
    40: "DownArrow",
    38: "UpArrow",
    27: "Escape",
    13: "Enter"
};
module.exports = makeCodeDispatcher;