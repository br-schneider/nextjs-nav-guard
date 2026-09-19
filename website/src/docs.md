# nextjs-nav-guard

Navigation guard for Next.js App Router. Prevent users from accidentally leaving pages with unsaved changes.

**Version note:** The navigation concurrency fixes and `NavigationGuardLink` documented here require version `1.1.0` or later. They are not included in `1.0.9`. See the [changelog](https://github.com/br-schneider/nextjs-nav-guard/blob/main/CHANGELOG) for release details.

Maintained by [Brett Schneider](https://github.com/br-schneider), based on [`next-navigation-guard`](https://github.com/LayerXcom/next-navigation-guard) by [LayerX](https://github.com/LayerXcom). This fork focuses on App Router compatibility, predictable confirmation behavior, and browser regression tests.

[Documentation](https://nextjs-nav-guard.vercel.app/) · [Run the demo](#demo) · [Contribute](https://github.com/br-schneider/nextjs-nav-guard/blob/main/CONTRIBUTING.md) · [Roadmap](https://github.com/br-schneider/nextjs-nav-guard/blob/main/ROADMAP.md)

[![Compatibility tests](https://github.com/br-schneider/nextjs-nav-guard/actions/workflows/e2e-tests.yml/badge.svg)](https://github.com/br-schneider/nextjs-nav-guard/actions/workflows/e2e-tests.yml)

## What's different from the original?

- **Next.js 16.2+ support:** fixed a runtime crash caused by `null` `history.state` in newer Next.js versions
- **Resilient internals:** private `next/dist/*` imports are centralized; if the context cannot be loaded, router and link interception are unavailable and a development warning explains it
- **Fixed React hooks violation:** removed a conditional `useContext` call that broke the rules of hooks
- **Pages Router removed:** focused on App Router only; Next.js still supports Pages Router, but this package does not
- **Better error messages:** actionable errors when the provider is missing, with code examples
- **Predictable confirmation:** overlapping attempts are blocked until the first attempt settles; unmounting or disabling a guard cancels its pending attempt
- **Explicit link integration:** `NavigationGuardLink` preserves `replace`, `scroll`, `onClick`, and `onNavigate`
- **Actively maintained:** compatible with Next.js 14, 15, and 16 (including 16.2+)

## Install

```bash
npm install nextjs-nav-guard
```

## Setup

Wrap your app with `NavigationGuardProvider` in your root layout. Mount the provider unconditionally, including while authentication or other async content is loading. Put loading branches inside it so its history listener registers before Next.js handles browser navigation.

```tsx
// app/layout.tsx
import { NavigationGuardProvider } from "nextjs-nav-guard";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NavigationGuardProvider>{children}</NavigationGuardProvider>
      </body>
    </html>
  );
}
```

## Usage

### Simple: `window.confirm()`

```tsx
"use client";

import { useState } from "react";
import { useNavigationGuard } from "nextjs-nav-guard";

export default function NameForm() {
  const [name, setName] = useState("");
  useNavigationGuard({
    enabled: name !== "",
    confirm: () => window.confirm("Discard your changes?"),
  });

  return (
    <label>
      Name
      <input value={name} onChange={(event) => setName(event.target.value)} />
    </label>
  );
}
```

### Custom dialog UI

If you want full control over the confirmation UI, omit the `confirm` callback. The hook returns `active`, `accept`, and `reject` to drive your own dialog:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useNavigationGuard } from "nextjs-nav-guard";

export default function NoteForm() {
  const [note, setNote] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const guard = useNavigationGuard({ enabled: note !== "" });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (guard.active && dialog && !dialog.open) dialog.showModal();
    if (!guard.active && dialog?.open) dialog.close();
  }, [guard.active]);

  return (
    <>
      <label>
        Note
        <textarea value={note} onChange={(event) => setNote(event.target.value)} />
      </label>
      <dialog ref={dialogRef} aria-label="Discard your changes?" onCancel={(event) => {
        event.preventDefault();
        guard.reject();
      }}>
        <p>You have unsaved changes.</p>
        <button onClick={guard.reject}>Keep editing</button>
        <button onClick={guard.accept}>Discard and leave</button>
      </dialog>
    </>
  );
}
```

### Links with options and callbacks

Use `NavigationGuardLink` when a link needs replacement history, scroll control, or click/navigation callbacks. It wraps Next.js Link and works with the same provider and guards.

```tsx
import { NavigationGuardLink } from "nextjs-nav-guard";

export default function SettingsLink() {
  return (
    <NavigationGuardLink href="/settings" replace scroll={false}>
      Settings
    </NavigationGuardLink>
  );
}
```

`onClick` and `onNavigate` can prevent navigation. Modified clicks, new tabs, downloads, and external links retain their normal browser behavior. Legacy Link children are not supported by this component.

### Save and leave

After a successful save, commit the clean form state before calling the router. Do not clear the dirty state if saving fails. The [complete demo](https://github.com/br-schneider/nextjs-nav-guard/blob/main/example/src/components/FormDemo.tsx) shows this with `flushSync`, a browser-local save, and `router.push()`.

### Conditional guard with navigation type

The `enabled` option can be a function that receives the navigation type, letting you guard selectively:

```tsx
useNavigationGuard({
  enabled: ({ type }) => {
    // Only guard against link clicks and back/forward, not refresh
    return type !== "refresh" && type !== "beforeunload";
  },
  confirm: () => window.confirm("Discard changes?"),
});
```

## API

### `<NavigationGuardProvider>`

Wrap your app with this provider. It intercepts navigation at multiple levels:

- **Router methods:** `router.push()`, `router.replace()`, `router.refresh()`
- **Link clicks:** `<Link>` and `<a>` tag clicks
- **Browser navigation:** back and forward buttons, `history.go()`
- **Page unload:** tab close, `window.location` changes

### `useNavigationGuard(options)`

Register a navigation guard. Returns `{ active, accept, reject }`.

Only one confirmation runs at a time within a provider. The first attempted destination wins; further attempts are blocked until it settles. Every enabled guard must accept. Rejected promises and thrown callbacks block navigation.

Unmounting a guard, setting `enabled: false`, or setting `disableForTesting: true` cancels its pending confirmation. These actions do not automatically perform the cancelled navigation.

#### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `enabled` | `boolean \| (params) => boolean` | `true` | Whether the guard is active. Can be a function receiving `{ to, type }` |
| `confirm` | `(params) => boolean \| Promise<boolean>` | `undefined` | Sync or async confirmation callback. Return `true` to allow, `false` to block. If omitted, the hook uses async mode |
| `disableForTesting` | `boolean` | `false` | Makes the hook a complete no-op. No provider required. Use in tests and Storybook |

#### Return value

| Property | Type | Description |
|---|---|---|
| `active` | `boolean` | `true` when a navigation attempt is pending confirmation (async mode only) |
| `accept` | `() => void` | Allow the pending navigation |
| `reject` | `() => void` | Block the pending navigation |

#### Navigation params

The `enabled` function and `confirm` callback both receive:

| Property | Type | Description |
|---|---|---|
| `to` | `string` | The target URL |
| `type` | `"push" \| "replace" \| "refresh" \| "popstate" \| "beforeunload"` | How the navigation was triggered |

### `NavigationGuard` (type export)

The callback type, exported for convenience:

```tsx
import type { NavigationGuard } from "nextjs-nav-guard";

const myGuard: NavigationGuard = ({ to, type }) => {
  return window.confirm(`Navigate to ${to}?`);
};
```

## Migrating from `next-navigation-guard`

The API is identical. Just change the import:

```diff
- import { NavigationGuardProvider, useNavigationGuard } from "next-navigation-guard";
+ import { NavigationGuardProvider, useNavigationGuard } from "nextjs-nav-guard";
```

If you were using Pages Router, you'll need to switch to App Router. Pages Router support has been removed.

## Limitations

### Reloads and tab closes use the browser dialog

Custom dialog UIs only work for client-side navigations. When the browser fires `beforeunload` (page reload, tab close, leaving for another site), browsers do not allow async work or custom UI. The library can only request the browser's built-in confirmation dialog, and its text and appearance cannot be customized.

### Safari external-navigation limitation

In verification on Safari 27.0 and Playwright WebKit 26.5, cross-site navigation could leave a dirty page without firing `beforeunload`. The same behavior reproduced on a plain HTML page without React, Next.js, or this library. A tab-close prompt worked, and cancelling it preserved the unsaved text. These are separate browser behaviors.

Do not treat unload protection as guaranteed protection for external links or address-bar navigation in Safari. Save drafts independently when losing work would be costly. The library cannot cancel a browser event that never fires.

### Direct History API calls are not guarded

Calls made directly through `window.history.pushState()` or `window.history.replaceState()` bypass the guard. If you call either method yourself, confirm the navigation before calling it.

### Guarded link clicks are handled programmatically

To intercept `<Link>` and `<a>` clicks, the provider registers a capture-phase click handler. While a guard is enabled, that handler prevents the original click and stops its propagation while the confirmation is pending, then navigates via the App Router if accepted. Automatic interception cannot recover a standard Link's React-only `replace` or `scroll` props, and it suppresses the original click callbacks. Use `NavigationGuardLink` to preserve these behaviors. Automatic interception handles relative URLs; use `NavigationGuardLink` for same-origin absolute URLs.

### Mount the provider before async content

The provider's history listener must register before Next.js handles `popstate`. A provider first mounted after a loading screen or session check may miss Back/Forward navigation even while link guarding works. Keep the provider mounted in the root layout and place conditional content inside it. See the [community report](https://github.com/br-schneider/nextjs-nav-guard/pull/2).

### Browser limits

`beforeunload` is not reliable when a mobile browser is closed from the app switcher, and browsers require prior user interaction before displaying a prompt. Pair guards with draft saving where data loss is costly. Passing `enabled: false` removes the unload listener. Function-valued predicates retain a listener and are evaluated when unloading, so stable callbacks can read current form state. Predicates should be pure. A pending confirmation is cancelled when a render observes its predicate becoming false.

### Next.js 16.2 drops query-only replacements after an async guard

Next.js 16.2 has an App Router regression: after an async guard is accepted, a `router.replace()` that changes only the query string may be dropped. This is a Next.js bug, fixed in Next.js 16.3.0, and the library cannot safely work around it. If your app uses this pattern, stay on 16.1.x or upgrade to Next.js 16.3.0 or later.

## Compatibility

| Next.js | React | Status |
|---|---|---|
| 14.x | 18 | Supported |
| 15.x | 19 | Supported and tested for App Router |
| 16.x | 19 | Supported (16.2 has a known Next.js router bug, see [Limitations](#limitations)) |

## Demo

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm build
pnpm --dir example dev
```

Open http://localhost:3000. Edit the note, try leaving, cancel with Escape, or save and leave. The demo stores a note only in your browser and does not send it to a server. `/playground` contains controls for reproducing guard lifecycle and router issues.

## Community

Bug reports, reproductions, tests, and documentation all help. Start with the [contribution guide](https://github.com/br-schneider/nextjs-nav-guard/blob/main/CONTRIBUTING.md) and [roadmap](https://github.com/br-schneider/nextjs-nav-guard/blob/main/ROADMAP.md), or [ask a question](https://github.com/br-schneider/nextjs-nav-guard/discussions).

If you use the package in production, share the integration and the navigation paths you rely on. Contributors are credited in release notes. Thanks to [Bruno Papista](https://github.com/papistacoding) for documenting the provider mounting issue.

## License

MIT license. Originally created by [LayerX Inc.](https://github.com/LayerXcom)
