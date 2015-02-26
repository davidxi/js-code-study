function Cancelable(func) {
    var isCanceled = false;

    function setCanceled() {
        isCanceled = true
    }

    function applyWithGuard() {
        if (isCanceled) {
            return
        }
        return func.apply(this, arguments)
    }
    return {
        action: applyWithGuard,
        cancel: setCanceled
    }
}

module.exports = Cancelable