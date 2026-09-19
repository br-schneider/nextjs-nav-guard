# Contributing

Thanks for helping improve nextjs-nav-guard. Reproductions, browser tests, documentation, and small fixes are all welcome. Brett Schneider maintains this App Router fork, based on the work of LayerX and its contributors.

## Get started

Use Node.js 22 and the pnpm version pinned in `package.json`.

```bash
git clone https://github.com/br-schneider/nextjs-nav-guard.git
cd nextjs-nav-guard
corepack enable
pnpm install --frozen-lockfile
pnpm build
pnpm --dir example dev
```

Open http://localhost:3000 for the form demo. `/playground` exposes router calls and guard lifecycle controls for reproductions. The example imports the local library's `dist` output, so run `pnpm watch` in another terminal while changing `src`.

## Verify a change

```bash
pnpm e2e:install
pnpm typecheck
pnpm e2e
pnpm e2e:production
pnpm check:packaging
pnpm --dir website build
```

Playwright starts and stops its own server on port 30000. Set `PORT` to use another port. To run one regression while iterating:

```bash
pnpm build
pnpm exec playwright test e2e/navigation-concurrency.spec.ts --project=chromium
```

CI builds production examples across Next.js 14.0 through 16.3. Next.js 14 uses React 18; Next.js 15 and 16 use React 19. Each row runs Chromium, Firefox, and WebKit. One existing WebKit test skips scripted page-unload prompts because that browser suppresses them under automation.

## Report a bug

Use the [bug form](https://github.com/br-schneider/nextjs-nav-guard/issues/new?template=bug.yml). Include the exact package versions, browser, and navigation action. A small reproduction based on `example` is particularly helpful.

Confirm the provider mounts unconditionally in the root layout. Remove credentials and customer data from public reproductions.

## Submit a change

- Start with a failing browser test for a behavior fix. Assert the URL and rendered content where history is involved.
- Cover acceptance, cancellation, and repeated attempts when changing navigation behavior.
- Keep the public API compatible unless the change has been discussed first.
- Include generated `dist` files after running `pnpm build`.
- Update the README, website documentation, and changelog when behavior changes.
- Keep the pull request focused and explain the problem and result briefly.

The [roadmap](ROADMAP.md) lists useful starting points. Ask about larger changes in [Discussions](https://github.com/br-schneider/nextjs-nav-guard/discussions) before investing time. Release notes credit contributors.

## Where things live

| Path | Purpose |
| --- | --- |
| `src/hooks` | Guard registration and browser/router interception |
| `src/utils/confirmNavigation.ts` | Confirmation ownership shared by navigation paths |
| `src/components/NavigationGuardLink.tsx` | Explicit Link integration |
| `example` | Runnable demo and reproduction controls |
| `e2e` | Browser behavior tests |
| `website` | Public documentation site |

## Release process

Release from a commit with passing compatibility and packaging checks. Update the version and changelog, inspect `pnpm pack`, then publish the reviewed package. Create a GitHub release with the corresponding tag and contributor credits. Publishing is a maintainer action, not an automatic side effect of merging a pull request.
