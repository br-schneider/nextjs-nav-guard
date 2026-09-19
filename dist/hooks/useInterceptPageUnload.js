"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useInterceptPageUnload = useInterceptPageUnload;
const useIsomorphicLayoutEffect_1 = require("./useIsomorphicLayoutEffect");
function useInterceptPageUnload(options) {
    (0, useIsomorphicLayoutEffect_1.useIsomorphicLayoutEffect)(() => {
        const isEnabled = () => {
            var _a;
            if (options.disableForTesting)
                return false;
            try {
                return typeof options.enabled === "function"
                    ? options.enabled({ to: "", type: "beforeunload" })
                    : (_a = options.enabled) !== null && _a !== void 0 ? _a : true;
            }
            catch {
                return true;
            }
        };
        if (!isEnabled())
            return;
        const handleBeforeUnload = (event) => {
            // We does not support confirm() on beforeunload as
            // we cannot wait for async Promise resolution on beforeunload.
            const enabled = isEnabled();
            if (enabled) {
                event.preventDefault();
                // As MDN says, custom message has already been unsupported in majority of browsers.
                // Chrome requires returnValue to be set.
                event.returnValue = "";
                return;
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [options.enabled, options.disableForTesting]);
}
