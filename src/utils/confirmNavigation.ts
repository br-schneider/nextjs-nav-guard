import { GuardDef, NavigationGuardParams } from "../types";
import { debug } from "./debug";

const pending = new WeakSet<Map<string, GuardDef>>();

export function hasEnabledGuards(
  guards: Map<string, GuardDef>,
  params: NavigationGuardParams,
) {
  if (pending.has(guards)) return true;
  try {
    return [...guards.values()].some((guard) => guard.enabled(params));
  } catch (error) {
    debug("Guard enabled callback error:", error);
    return true;
  }
}

export async function confirmNavigation(
  guards: Map<string, GuardDef>,
  params: NavigationGuardParams,
): Promise<boolean> {
  if (pending.has(guards)) return false;
  pending.add(guards);
  const registeredGuards = new Map(guards);
  const registrationsUnchanged = () =>
    guards.size === registeredGuards.size &&
    [...registeredGuards].every(([id, guard]) => guards.get(id) === guard);
  try {
    for (const guard of registeredGuards.values()) {
      if (!registrationsUnchanged()) return false;
      if (!guard.enabled(params)) continue;
      if (!(await guard.callback(params)) || !registrationsUnchanged())
        return false;
    }
    return registrationsUnchanged();
  } catch (error) {
    debug("Guard callback error:", error);
    return false;
  } finally {
    pending.delete(guards);
  }
}
