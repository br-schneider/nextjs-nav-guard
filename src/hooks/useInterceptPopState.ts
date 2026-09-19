import { GuardDef, RenderedState } from "../types";
import { DEBUG } from "../utils/debug";
import {
  confirmNavigation,
  hasEnabledGuards,
} from "../utils/confirmNavigation";
import {
  newToken,
  setupHistoryAugmentationOnce,
} from "../utils/historyAugmentation";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";

// Based on https://github.com/vercel/next.js/discussions/47020#discussioncomment-7826121

const renderedStateRef: { current: RenderedState } = {
  current: { index: -1, token: "" },
};

export function useInterceptPopState({
  guardMapRef,
}: {
  guardMapRef: React.MutableRefObject<Map<string, GuardDef>>;
}) {
  useIsomorphicLayoutEffect(() => {
    // NOTE: Called before Next.js router setup which is useEffect().
    const { writeState } = setupHistoryAugmentationOnce({ renderedStateRef });

    const handlePopState = createHandlePopState(guardMapRef, writeState);

    const onPopState = (event: PopStateEvent) => {
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

function createHandlePopState(
  guardMapRef: React.MutableRefObject<Map<string, GuardDef>>,
  writeState: () => void,
) {
  let pending: {
    targetIndex: number;
    restored: boolean;
    accepted?: boolean;
    replaying: boolean;
  } | null = null;

  const resume = () => {
    if (!pending?.restored) return;
    if (pending.accepted === false) {
      pending = null;
    } else if (pending.accepted === true) {
      pending.replaying = true;
      window.history.go(pending.targetIndex - renderedStateRef.current.index);
    }
  };

  return (nextState: any = {}): boolean => {
    const token: string | undefined = nextState?.__next_navigation_guard_token;
    const nextIndex =
      Number(nextState?.__next_navigation_guard_stack_index) || 0;

    if (!token || token !== renderedStateRef.current.token) {
      pending = null;
      renderedStateRef.current.token = token || newToken();
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
      if (pending.restored) resume();
      else window.history.go(renderedStateRef.current.index - nextIndex);
      return false;
    }

    const delta = nextIndex - renderedStateRef.current.index;
    // When go(-delta) is called, delta should be zero.
    if (delta === 0) return false;

    const params = {
      to: location.pathname + location.search + location.hash,
      type: "popstate",
    } as const;
    if (!hasEnabledGuards(guardMapRef.current, params)) {
      renderedStateRef.current.index = nextIndex;
      return true;
    }

    const attempt = {
      targetIndex: nextIndex,
      restored: false,
      replaying: false,
    };
    pending = attempt;
    window.history.go(-delta);

    // Wait for all callbacks to be resolved
    void confirmNavigation(guardMapRef.current, params).then((accepted) => {
      if (pending !== attempt) return;
      pending.accepted = accepted;
      if (DEBUG)
        console.log("useInterceptPopState(): confirmation resolved", accepted);
      // accept
      resume();
    });

    // Return false to call stopImmediatePropagation()
    return false;
  };
}
