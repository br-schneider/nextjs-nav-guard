"use client";

import Link from "next/link";
import { ComponentPropsWithoutRef, forwardRef, useContext } from "react";
import { NavigationGuardProviderContext, OriginalAppRouterContext } from "./NavigationGuardProviderContext";
import { confirmNavigation, hasEnabledGuards } from "../utils/confirmNavigation";

export type NavigationGuardLinkProps = Omit<ComponentPropsWithoutRef<typeof Link>, "legacyBehavior" | "onNavigate"> & {
  onNavigate?: (event: { preventDefault(): void }) => void;
};

export const NavigationGuardLink = forwardRef<HTMLAnchorElement, NavigationGuardLinkProps>(
  function NavigationGuardLink({ onClick, onNavigate, replace, scroll, ...props }, ref) {
    const guards = useContext(NavigationGuardProviderContext);
    const router = useContext(OriginalAppRouterContext);

    return <Link {...props} ref={ref} replace={replace} scroll={scroll}
      data-navigation-guard="managed"
      onClick={(event) => {
        onClick?.(event);
        const link = event.currentTarget;
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
            event.shiftKey || event.altKey || link.hasAttribute("download") ||
            (link.target && link.target !== "_self")) return;
        const href = link.getAttribute("href");
        if (!href || href.startsWith("#")) return;
        const url = new URL(href, location.href);
        if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return;
        let cancelled = false;
        onNavigate?.({ preventDefault: () => { cancelled = true; } });
        if (cancelled) {
          event.preventDefault();
          return;
        }
        const params = { to: href, type: replace ? "replace" : "push" } as const;
        if (!guards || !router || !hasEnabledGuards(guards.current, params)) return;

        event.preventDefault();
        void confirmNavigation(guards.current, params).then((accepted) => {
          if (accepted && link.isConnected) router[params.type](href, { scroll });
        });
      }} />;
  }
);
