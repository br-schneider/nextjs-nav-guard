import { useCallback, useContext, useId, useRef, useState } from "react";
import { NavigationGuardProviderContext } from "../components/NavigationGuardProviderContext";
import {
  NavigationGuardCallback,
  NavigationGuardOptions,
  NavigationGuardParams,
} from "../types";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";
import { debug } from "../utils/debug";
import { useInterceptPageUnload } from "./useInterceptPageUnload";

// Should memoize callback func
export function useNavigationGuard(options: NavigationGuardOptions) {
  useInterceptPageUnload(options);
  const callbackId = useId();
  const guardMapRef = useContext(NavigationGuardProviderContext);
  if (!guardMapRef && !options.disableForTesting)
    throw new Error(
      "[next-nav-guard] useNavigationGuard must be used within <NavigationGuardProvider>.\n" +
        "Add it to your root layout (app/layout.tsx):\n\n" +
        '  import { NavigationGuardProvider } from "nextjs-nav-guard";\n\n' +
        "  export default function RootLayout({ children }) {\n" +
        "    return <NavigationGuardProvider>{children}</NavigationGuardProvider>;\n" +
        "  }",
    );

  const [pendingState, setPendingState] = useState<{
    resolve: (accepted: boolean) => void;
  } | null>(null);
  const optionsRef = useRef(options);
  const resolvePendingRef = useRef<((accepted: boolean) => void) | null>(null);
  const pendingParamsRef = useRef<NavigationGuardParams | null>(null);

  useIsomorphicLayoutEffect(() => {
    optionsRef.current = options;
    let enabled = options.enabled !== false;
    if (pendingParamsRef.current && typeof options.enabled === "function") {
      try {
        enabled = options.enabled(pendingParamsRef.current);
      } catch {
        enabled = true;
      }
    }
    if (!enabled || options.disableForTesting) {
      resolvePendingRef.current?.(false);
      setPendingState(null);
    }
  });

  useIsomorphicLayoutEffect(() => {
    if (options.disableForTesting) return;

    const callback: NavigationGuardCallback = (params) => {
      debug(`Guard callback called with:`, params);
      return new Promise<boolean>((resolve) => {
        resolvePendingRef.current?.(false);
        let settled = false;
        const settle = (accepted: boolean) => {
          if (settled) return;
          settled = true;
          if (resolvePendingRef.current === settle) {
            resolvePendingRef.current = null;
            pendingParamsRef.current = null;
          }
          resolve(accepted);
        };
        resolvePendingRef.current = settle;
        pendingParamsRef.current = params;
        const confirm = optionsRef.current.confirm;
        if (confirm) {
          debug(`Using sync confirm function`);
          try {
            Promise.resolve(confirm(params)).then(settle, () => settle(false));
          } catch (error) {
            debug("Guard callback error:", error);
            settle(false);
          }
          return;
        }

        debug(`Using async confirm, setting pending state`);
        // Small delay to ensure state update propagates
        setTimeout(() => {
          if (!settled) setPendingState({ resolve: settle });
        }, 0);
      });
    };

    guardMapRef!.current.set(callbackId, {
      enabled: (params) => {
        const enabled = optionsRef.current.enabled;
        return typeof enabled === "function"
          ? enabled(params)
          : (enabled ?? true);
      },
      callback,
    });

    return () => {
      resolvePendingRef.current?.(false);
      guardMapRef!.current.delete(callbackId);
    };
  }, [callbackId, guardMapRef, options.disableForTesting]);

  const active = options.disableForTesting ? false : pendingState !== null;

  const accept = useCallback(() => {
    if (!pendingState) return;
    pendingState.resolve(true);
    setPendingState(null);
  }, [pendingState]);

  const reject = useCallback(() => {
    if (!pendingState) return;
    pendingState.resolve(false);
    setPendingState(null);
  }, [pendingState]);

  return { active, accept, reject };
}
