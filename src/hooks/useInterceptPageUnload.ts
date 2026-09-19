import { NavigationGuardOptions } from "../types";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";

export function useInterceptPageUnload(options: NavigationGuardOptions) {
  useIsomorphicLayoutEffect(() => {
    const isEnabled = () => {
      if (options.disableForTesting) return false;
      try {
        return typeof options.enabled === "function"
          ? options.enabled({ to: "", type: "beforeunload" })
          : options.enabled ?? true;
      } catch {
        return true;
      }
    };
    if (!isEnabled()) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
        // We does not support confirm() on beforeunload as
        // we cannot wait for async Promise resolution on beforeunload.
        const enabled = isEnabled();
        if (enabled) {
          event.preventDefault();
          // As MDN says, custom message has already been unsupported in majority of browsers.
          // Chrome requires returnValue to be set.
          event.returnValue = "";
          return;
        }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [options.enabled, options.disableForTesting]);
}
