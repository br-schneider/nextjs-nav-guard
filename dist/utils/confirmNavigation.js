"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasEnabledGuards = hasEnabledGuards;
exports.confirmNavigation = confirmNavigation;
const debug_1 = require("./debug");
const pending = new WeakSet();
function hasEnabledGuards(guards, params) {
    if (pending.has(guards))
        return true;
    try {
        return [...guards.values()].some((guard) => guard.enabled(params));
    }
    catch (error) {
        (0, debug_1.debug)("Guard enabled callback error:", error);
        return true;
    }
}
async function confirmNavigation(guards, params) {
    if (pending.has(guards))
        return false;
    pending.add(guards);
    try {
        for (const [id, guard] of [...guards]) {
            if (!guards.has(id))
                return false;
            if (!guard.enabled(params))
                continue;
            if (!(await guard.callback(params)) || !guards.has(id))
                return false;
        }
        return true;
    }
    catch (error) {
        (0, debug_1.debug)("Guard callback error:", error);
        return false;
    }
    finally {
        pending.delete(guards);
    }
}
