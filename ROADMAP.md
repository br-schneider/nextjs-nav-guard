# Roadmap

The priority is dependable protection for unsaved work in Next.js App Router. Keep the API small and make browser limitations explicit.

## Current work

- Give the first pending navigation exclusive ownership of confirmation.
- Cancel pending work when a guard unmounts or is disabled.
- Preserve link options through an explicit Link component.
- Verify supported Next.js versions in production builds across three browsers.
- Provide a complete form demo and a short path to contributing.

## Good places to help

### React Hook Form recipe

Add a small example that derives the guard from `formState.isDirty`, resets dirty state only after a successful save, and navigates without prompting again. Include acceptance and cancellation coverage through the example app.

### History restoration regression

Expand browser tests around cancelled Back/Forward navigation and scroll restoration. Assert both the visible page and URL. Keep the reproduction small enough to run on every supported version.

### Accessible dialog alternatives

Add an integration recipe for a commonly used dialog component. Cover focus restoration, Escape, and explicit accept/reject actions. Keep UI dependencies out of the library itself.

## Investigate before promising support

- Providers mounted after Next.js installs its history listener.
- Nested providers and independently mounted roots.
- Same-document hash history mixed with guarded route changes.
- Future public Next.js navigation-blocking APIs that could reduce reliance on private internals.

Start a [discussion](https://github.com/br-schneider/nextjs-nav-guard/discussions) with the use case and a reproduction. This list is an invitation to help, not a delivery schedule.
