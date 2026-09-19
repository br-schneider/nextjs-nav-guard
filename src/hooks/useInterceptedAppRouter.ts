import { MutableRefObject, useContext, useMemo } from "react";
import { AppRouterLike, GuardDef } from "../types";
import { debug } from "../utils/debug";
import { confirmNavigation, hasEnabledGuards } from "../utils/confirmNavigation";
import {
  AppRouterContext,
  FallbackRouterContext,
} from "../utils/nextInternals";

export function useInterceptedAppRouter({
  guardMapRef,
}: {
  guardMapRef: MutableRefObject<Map<string, GuardDef>>;
}) {
  const origRouter: AppRouterLike | null = useContext(
    AppRouterContext ?? FallbackRouterContext
  );

  return useMemo((): AppRouterLike | null => {
    if (!origRouter) {
      debug("No original router found");
      return null;
    }
    debug("Creating intercepted router");

    const guarded = async (
      type: "push" | "replace" | "refresh",
      to: string,
      accepted: () => void
    ) => {
      debug(`Navigation attempt: ${type} to ${to}`);
      const params = { to, type };
      if (hasEnabledGuards(guardMapRef.current, params) &&
          !(await confirmNavigation(guardMapRef.current, params))) {
        debug(`Navigation blocked`);
        return;
      }
      debug(`All guards passed, proceeding with navigation`);
      accepted();
    };

    return {
      ...origRouter,
      push: (href: string, ...args: any[]) => {
        debug(`push called with href: ${href}`);
        guarded("push", href, () => origRouter.push(href, ...args));
      },
      replace: (href: string, ...args: any[]) => {
        guarded("replace", href, () => origRouter.replace(href, ...args));
      },
      refresh: (...args: any[]) => {
        guarded("refresh", location.pathname + location.search, () => origRouter.refresh(...args));
      },
    };
  }, [origRouter]);
}
