# nextjs-nav-guard

Prevent accidental navigation away from unsaved changes in the Next.js App Router. Zero config, two lines of code.

- npm: https://www.npmjs.com/package/nextjs-nav-guard
- Repository: https://github.com/br-schneider/nextjs-nav-guard

## Install

```bash
npm install nextjs-nav-guard
```

## What it intercepts

- Router methods: `router.push()`, `router.replace()`, `router.refresh()`
- Link clicks: Next.js `<Link>` and plain `<a>` tags
- Browser navigation: back and forward buttons, `history.go()`
- Page unload: tab close and `window.location` changes

## Quick start

1. Wrap your app with the provider in your root layout:

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

2. Use the hook in any component with unsaved changes:

```tsx
import { useNavigationGuard } from "nextjs-nav-guard";

function MyForm() {
  const [isDirty, setIsDirty] = useState(false);

  useNavigationGuard({
    enabled: isDirty,
    confirm: () => window.confirm("You have unsaved changes. Leave anyway?"),
  });

  return <form>{/* your form */}</form>;
}
```

That is it. Two imports, two lines of setup.

## Custom dialog UI

Omit the `confirm` callback to use async mode. The hook returns `active`, `accept`, and `reject`, so you can render your own confirmation dialog.

```tsx
import { useNavigationGuard } from "nextjs-nav-guard";

function MyForm() {
  const [isDirty, setIsDirty] = useState(false);
  const guard = useNavigationGuard({ enabled: isDirty });

  return (
    <>
      <form>{/* your form */}</form>

      {guard.active && (
        <Dialog open>
          <p>You have unsaved changes. Leave anyway?</p>
          <button onClick={guard.reject}>Stay</button>
          <button onClick={guard.accept}>Leave</button>
        </Dialog>
      )}
    </>
  );
}
```

## Conditional guard

The `enabled` option accepts a function that receives the navigation type, so you can guard selectively.

```tsx
useNavigationGuard({
  enabled: ({ type }) => {
    return type !== "refresh" && type !== "beforeunload";
  },
  confirm: () => window.confirm("Discard changes?"),
});
```

## API reference

### `<NavigationGuardProvider>`

Wrap your app with this provider in your root layout. It sets up interception of all the navigation methods listed above. No props are required other than `children`.

### `useNavigationGuard(options)`

Register a navigation guard. Returns an object with `active`, `accept`, and `reject`.

Options:

- `enabled` (`boolean | (params) => boolean`, default `true`): whether the guard is active. Can be a function receiving `{ to, type }`.
- `confirm` (`(params) => boolean | Promise<boolean>`, default `undefined`): confirmation callback. Return `true` to allow, `false` to block. If omitted, the hook uses async mode.
- `disableForTesting` (`boolean`, default `false`): makes the hook a no-op. No provider required. Use in tests and Storybook.

Return value:

- `active` (`boolean`): `true` when a navigation attempt is pending confirmation (async mode only).
- `accept` (`() => void`): allow the pending navigation.
- `reject` (`() => void`): block the pending navigation.

Navigation params passed to `enabled` and `confirm`:

- `to` (`string`): the target URL.
- `type` (`"push" | "replace" | "refresh" | "popstate" | "beforeunload"`): how the navigation was triggered.

## Compatibility

- Next.js 14.x with React 18 or 19: supported
- Next.js 15.x with React 18 or 19: supported
- Next.js 16.0 to 16.2+ with React 19: supported

## Migrating from next-navigation-guard

The API is identical. Change the import from `next-navigation-guard` to `nextjs-nav-guard`. If you were using Pages Router, switch to App Router. Pages Router support has been removed.

## License

MIT license. Originally created by LayerX Inc.
