import { GuardDef, NavigationGuardParams } from "../types";
export declare function hasEnabledGuards(guards: Map<string, GuardDef>, params: NavigationGuardParams): boolean;
export declare function confirmNavigation(guards: Map<string, GuardDef>, params: NavigationGuardParams): Promise<boolean>;
//# sourceMappingURL=confirmNavigation.d.ts.map