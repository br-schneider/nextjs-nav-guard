"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNavigationGuard = useNavigationGuard;
const react_1 = require("react");
const NavigationGuardProviderContext_1 = require("../components/NavigationGuardProviderContext");
const useIsomorphicLayoutEffect_1 = require("./useIsomorphicLayoutEffect");
const debug_1 = require("../utils/debug");
const useInterceptPageUnload_1 = require("./useInterceptPageUnload");
// Should memoize callback func
function useNavigationGuard(options) {
    (0, useInterceptPageUnload_1.useInterceptPageUnload)(options);
    const callbackId = (0, react_1.useId)();
    const guardMapRef = (0, react_1.useContext)(NavigationGuardProviderContext_1.NavigationGuardProviderContext);
    if (!guardMapRef && !options.disableForTesting)
        throw new Error("[next-nav-guard] useNavigationGuard must be used within <NavigationGuardProvider>.\n" +
            "Add it to your root layout (app/layout.tsx):\n\n" +
            '  import { NavigationGuardProvider } from "nextjs-nav-guard";\n\n' +
            "  export default function RootLayout({ children }) {\n" +
            "    return <NavigationGuardProvider>{children}</NavigationGuardProvider>;\n" +
            "  }");
    const [pendingState, setPendingState] = (0, react_1.useState)(null);
    const optionsRef = (0, react_1.useRef)(options);
    const resolvePendingRef = (0, react_1.useRef)(null);
    (0, useIsomorphicLayoutEffect_1.useIsomorphicLayoutEffect)(() => {
        var _a;
        optionsRef.current = options;
        if (options.enabled === false || options.disableForTesting) {
            (_a = resolvePendingRef.current) === null || _a === void 0 ? void 0 : _a.call(resolvePendingRef, false);
            setPendingState(null);
        }
    });
    (0, useIsomorphicLayoutEffect_1.useIsomorphicLayoutEffect)(() => {
        if (options.disableForTesting)
            return;
        const callback = (params) => {
            (0, debug_1.debug)(`Guard callback called with:`, params);
            return new Promise((resolve) => {
                var _a;
                (_a = resolvePendingRef.current) === null || _a === void 0 ? void 0 : _a.call(resolvePendingRef, false);
                let settled = false;
                const settle = (accepted) => {
                    if (settled)
                        return;
                    settled = true;
                    if (resolvePendingRef.current === settle)
                        resolvePendingRef.current = null;
                    resolve(accepted);
                };
                resolvePendingRef.current = settle;
                const confirm = optionsRef.current.confirm;
                if (confirm) {
                    (0, debug_1.debug)(`Using sync confirm function`);
                    try {
                        Promise.resolve(confirm(params)).then(settle, () => settle(false));
                    }
                    catch (error) {
                        (0, debug_1.debug)("Guard callback error:", error);
                        settle(false);
                    }
                    return;
                }
                (0, debug_1.debug)(`Using async confirm, setting pending state`);
                // Small delay to ensure state update propagates
                setTimeout(() => {
                    if (!settled)
                        setPendingState({ resolve: settle });
                }, 0);
            });
        };
        guardMapRef.current.set(callbackId, {
            enabled: (params) => {
                const enabled = optionsRef.current.enabled;
                return typeof enabled === "function" ? enabled(params) : enabled !== null && enabled !== void 0 ? enabled : true;
            },
            callback,
        });
        return () => {
            var _a;
            (_a = resolvePendingRef.current) === null || _a === void 0 ? void 0 : _a.call(resolvePendingRef, false);
            guardMapRef.current.delete(callbackId);
        };
    }, [callbackId, guardMapRef, options.disableForTesting]);
    const active = options.disableForTesting ? false : pendingState !== null;
    const accept = (0, react_1.useCallback)(() => {
        if (!pendingState)
            return;
        pendingState.resolve(true);
        setPendingState(null);
    }, [pendingState]);
    const reject = (0, react_1.useCallback)(() => {
        if (!pendingState)
            return;
        pendingState.resolve(false);
        setPendingState(null);
    }, [pendingState]);
    return { active, accept, reject };
}
