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
    const registeredGuards = new Map(guards);
    const registrationsUnchanged = () => guards.size === registeredGuards.size &&
        [...registeredGuards].every(([id, guard]) => guards.get(id) === guard);
    try {
        for (const guard of registeredGuards.values()) {
            if (!registrationsUnchanged())
                return false;
            if (!guard.enabled(params))
                continue;
            if (!(await guard.callback(params)) || !registrationsUnchanged())
                return false;
        }
        return registrationsUnchanged();
    }
    catch (error) {
        (0, debug_1.debug)("Guard callback error:", error);
        return false;
    }
    finally {
        pending.delete(guards);
    }
}
