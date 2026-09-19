"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useInterceptedAppRouter = useInterceptedAppRouter;
const react_1 = require("react");
const debug_1 = require("../utils/debug");
const confirmNavigation_1 = require("../utils/confirmNavigation");
const nextInternals_1 = require("../utils/nextInternals");
function useInterceptedAppRouter({ guardMapRef, }) {
    const origRouter = (0, react_1.useContext)(nextInternals_1.AppRouterContext !== null && nextInternals_1.AppRouterContext !== void 0 ? nextInternals_1.AppRouterContext : nextInternals_1.FallbackRouterContext);
    return (0, react_1.useMemo)(() => {
        if (!origRouter) {
            (0, debug_1.debug)("No original router found");
            return null;
        }
        (0, debug_1.debug)("Creating intercepted router");
        const guarded = async (type, to, accepted) => {
            (0, debug_1.debug)(`Navigation attempt: ${type} to ${to}`);
            const params = { to, type };
            if ((0, confirmNavigation_1.hasEnabledGuards)(guardMapRef.current, params) &&
                !(await (0, confirmNavigation_1.confirmNavigation)(guardMapRef.current, params))) {
                (0, debug_1.debug)(`Navigation blocked`);
                return;
            }
            (0, debug_1.debug)(`All guards passed, proceeding with navigation`);
            accepted();
        };
        return {
            ...origRouter,
            push: (href, ...args) => {
                (0, debug_1.debug)(`push called with href: ${href}`);
                guarded("push", href, () => origRouter.push(href, ...args));
            },
            replace: (href, ...args) => {
                guarded("replace", href, () => origRouter.replace(href, ...args));
            },
            refresh: (...args) => {
                guarded("refresh", location.pathname + location.search, () => origRouter.refresh(...args));
            },
        };
    }, [origRouter]);
}
