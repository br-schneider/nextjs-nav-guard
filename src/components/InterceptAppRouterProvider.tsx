"use client";

import { type MutableRefObject, type ReactNode, useContext } from "react";
import { useInterceptedAppRouter } from "../hooks/useInterceptedAppRouter";
import { GuardDef } from "../types";
import { AppRouterContext, FallbackRouterContext } from "../utils/nextInternals";
import { OriginalAppRouterContext } from "./NavigationGuardProviderContext";

let warnedMissingContext = false;

export function InterceptAppRouterProvider({
  guardMapRef,
  children,
}: {
  guardMapRef: MutableRefObject<Map<string, GuardDef>>;
  children: ReactNode;
}) {
  const interceptedRouter = useInterceptedAppRouter({ guardMapRef });
  const originalRouter = useContext(AppRouterContext ?? FallbackRouterContext);

  if (!AppRouterContext) {
    if (process.env.NODE_ENV === "development" && !warnedMissingContext) {
      warnedMissingContext = true;
      console.warn(
        "[next-nav-guard] Could not access Next.js router context. " +
          "Router interception (push/replace) will not work. " +
          "Link click interception is also unavailable. Browser history and page unload guards remain installed. " +
          "This may happen if your Next.js version changed internal APIs. Please update nextjs-nav-guard."
      );
    }
    return <>{children}</>;
  }

  if (!interceptedRouter) {
    return <>{children}</>;
  }

  return (
    <OriginalAppRouterContext.Provider value={originalRouter}>
    <AppRouterContext.Provider value={interceptedRouter}>
      {children}
    </AppRouterContext.Provider>
    </OriginalAppRouterContext.Provider>
  );
}
