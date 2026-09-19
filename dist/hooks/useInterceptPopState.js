"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useInterceptPopState = useInterceptPopState;
const debug_1 = require("../utils/debug");
const confirmNavigation_1 = require("../utils/confirmNavigation");
const historyAugmentation_1 = require("../utils/historyAugmentation");
const useIsomorphicLayoutEffect_1 = require("./useIsomorphicLayoutEffect");
// Based on https://github.com/vercel/next.js/discussions/47020#discussioncomment-7826121
const renderedStateRef = {
    current: { index: -1, token: "" },
};
function useInterceptPopState({ guardMapRef, }) {
    (0, useIsomorphicLayoutEffect_1.useIsomorphicLayoutEffect)(() => {
        // NOTE: Called before Next.js router setup which is useEffect().
        const { writeState } = (0, historyAugmentation_1.setupHistoryAugmentationOnce)({ renderedStateRef });
        const handlePopState = createHandlePopState(guardMapRef, writeState);
        const onPopState = (event) => {
            if (!handlePopState(event.state)) {
                event.stopImmediatePropagation();
            }
        };
        // NOTE: Called before Next.js router setup which is useEffect().
        // NOTE: capture on popstate listener is not working on Chrome.
        window.addEventListener("popstate", onPopState);
        return () => {
            window.removeEventListener("popstate", onPopState);
        };
    }, []);
}
function createHandlePopState(guardMapRef, writeState) {
    let pending = null;
    const resume = () => {
        if (!(pending === null || pending === void 0 ? void 0 : pending.restored))
            return;
        if (pending.accepted === false) {
            pending = null;
        }
        else if (pending.accepted === true) {
            pending.replaying = true;
            window.history.go(pending.targetIndex - renderedStateRef.current.index);
        }
    };
    return (nextState = {}) => {
        const token = nextState === null || nextState === void 0 ? void 0 : nextState.__next_navigation_guard_token;
        const nextIndex = Number(nextState === null || nextState === void 0 ? void 0 : nextState.__next_navigation_guard_stack_index) || 0;
        if (!token || token !== renderedStateRef.current.token) {
            pending = null;
            renderedStateRef.current.token = token || (0, historyAugmentation_1.newToken)();
            renderedStateRef.current.index = token ? nextIndex : 0;
            writeState();
            return true;
        }
        if (pending) {
            if (pending.replaying && nextIndex === pending.targetIndex) {
                pending = null;
                renderedStateRef.current.index = nextIndex;
                return true;
            }
            pending.restored = nextIndex === renderedStateRef.current.index;
            if (pending.restored)
                resume();
            else
                window.history.go(renderedStateRef.current.index - nextIndex);
            return false;
        }
        const delta = nextIndex - renderedStateRef.current.index;
        // When go(-delta) is called, delta should be zero.
        if (delta === 0)
            return false;
        const params = { to: location.pathname + location.search + location.hash, type: "popstate" };
        if (!(0, confirmNavigation_1.hasEnabledGuards)(guardMapRef.current, params)) {
            renderedStateRef.current.index = nextIndex;
            return true;
        }
        const attempt = { targetIndex: nextIndex, restored: false, replaying: false };
        pending = attempt;
        window.history.go(-delta);
        // Wait for all callbacks to be resolved
        void (0, confirmNavigation_1.confirmNavigation)(guardMapRef.current, params).then((accepted) => {
            if (pending !== attempt)
                return;
            pending.accepted = accepted;
            if (debug_1.DEBUG)
                console.log("useInterceptPopState(): confirmation resolved", accepted);
            // accept
            resume();
        });
        // Return false to call stopImmediatePropagation()
        return false;
    };
}
