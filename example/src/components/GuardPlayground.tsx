"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { NavigationGuardLink, useNavigationGuard } from "nextjs-nav-guard";

function Guard({ mode, label = "Editor" }: { mode: string; label?: string }) {
  const [enabled, setEnabled] = useState(true);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const stableEnabled = useCallback(() => enabledRef.current, []);
  const guard = useNavigationGuard({
    enabled:
      mode === "stable"
        ? stableEnabled
        : mode === "selective"
          ? ({ to }) => enabled && to === "/page2"
          : enabled,
    disableForTesting: mode === "disabled",
    confirm:
      mode === "throw"
        ? () => {
            throw new Error("Confirmation failed");
          }
        : mode === "reject"
          ? () => Promise.reject(new Error("Confirmation failed"))
          : mode === "pending"
            ? () => new Promise<boolean>(() => {})
            : undefined,
  });
  return (
    <section aria-label={`${label} guard`}>
      <label>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
        />
        Dirty {label.toLowerCase()}
      </label>
      {guard.active && (
        <div
          role="dialog"
          aria-label={`Leave ${label.toLowerCase()}?`}
          style={{
            position: "fixed",
            top: 16,
            right: 16,
            background: "Canvas",
            padding: 16,
            zIndex: 1,
          }}
        >
          <button onClick={guard.reject}>Stay</button>
          <button onClick={guard.accept}>Leave</button>
        </div>
      )}
    </section>
  );
}

export function GuardPlayground() {
  const router = useRouter();
  const [mounted, setMounted] = useState(true);
  const [mode, setMode] = useState("dialog");
  const [multiple, setMultiple] = useState(false);
  const [clicks, setClicks] = useState(0);
  const [navigations, setNavigations] = useState(0);
  return (
    <main>
      <h1>Guard playground</h1>
      <label>
        Confirmation mode
        <select value={mode} onChange={(event) => setMode(event.target.value)}>
          <option value="dialog">Dialog</option>
          <option value="throw">Throw</option>
          <option value="reject">Reject promise</option>
          <option value="pending">Pending promise</option>
          <option value="stable">Stable predicate</option>
          <option value="selective">Only destination two</option>
          <option value="disabled">Disabled for testing</option>
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          checked={multiple}
          onChange={(event) => setMultiple(event.target.checked)}
        />
        Multiple guards
      </label>
      <button onClick={() => setMounted(!mounted)}>
        {mounted ? "Unmount editor" : "Mount editor"}
      </button>
      {mounted && <Guard mode={mode} />}
      {multiple && <Guard mode="dialog" label="Second editor" />}
      <Link href="/page1">Destination one</Link>
      <Link href="/page2">Destination two</Link>
      <NavigationGuardLink href="/page2" replace scroll={false}>
        Replace link
      </NavigationGuardLink>
      <NavigationGuardLink
        href="/page2"
        onClick={() => setClicks(clicks + 1)}
        onNavigate={() => setNavigations(navigations + 1)}
      >
        Link with callbacks
      </NavigationGuardLink>
      <NavigationGuardLink
        href="/page2"
        onClick={(event) => event.preventDefault()}
      >
        Click cancelled link
      </NavigationGuardLink>
      <NavigationGuardLink
        href="/page2"
        onNavigate={(event) => event.preventDefault()}
      >
        Navigation cancelled link
      </NavigationGuardLink>
      <NavigationGuardLink
        href="#section"
        onNavigate={(event) => event.preventDefault()}
      >
        Cancelled hash link
      </NavigationGuardLink>
      <button onClick={() => window.location.assign("/page1")}>
        Hard navigation
      </button>
      <output>
        Clicks: {clicks}, navigations: {navigations}
      </output>
      <button onClick={() => router.push("/page1")}>Push destination</button>
      <button onClick={() => router.replace("/page2")}>
        Replace destination
      </button>
      <button onClick={() => router.back()}>Back</button>
      <button onClick={() => router.forward()}>Forward</button>
      <div style={{ height: 1600 }} />
      <NavigationGuardLink href="/playground?view=next" scroll={false}>
        Keep scroll position
      </NavigationGuardLink>
    </main>
  );
}
