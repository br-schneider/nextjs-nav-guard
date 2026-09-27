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
pnpm audit
pnpm e2e
pnpm e2e:production
pnpm e2e:base-path
pnpm check:packaging
pnpm --dir website build
```

Playwright starts and stops its own server on port 30000. Set `PORT` to use another port. To run one regression while iterating:

```bash
pnpm build
pnpm exec playwright test e2e/navigation-concurrency.spec.ts --project=chromium
```

CI builds production examples across Next.js 14.0 through 16.3. Next.js 14 uses React 18; Next.js 15 and 16 use React 19. Each row runs Chromium, Firefox, and WebKit. Tab-close acceptance and cancellation run on every engine without a skip. The external-navigation test runs on WebKit as an expected failure for the reproduced browser limitation; an unexpected pass fails CI so the expectation gets revisited.

Separate production builds test a `/docs` base path on Next.js 14.2, 15.5, and 16.3. Run `pnpm e2e:base-path` locally to check guarded links, replacement history, query strings, and scroll preservation. The base-path suite uses its own build; rebuild the example before switching back to the regular production suite.

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

Prepare the release in one pull request. Update `package.json` and the changelog, remove the release's unreleased notices from the README and website documentation, and check that documentation links point to the intended pages. Use version-specific wording such as "Starting with version 1.1.1" so the docs remain accurate before publishing.

Merge after compatibility and packaging checks pass. Create and publish a GitHub release with a matching tag, such as `v1.1.2` for version `1.1.2`, pointing to that commit on `main`. Include contributor credits in the release notes.

The README on npm is a snapshot from the published package. Updating it on GitHub does not update npm's copy; a documentation-only correction there requires a new package version. See [npm's README update instructions](https://docs.npmjs.com/about-package-readme-files/#updating-an-existing-package-readmemd-file). After publishing succeeds, check the README on npm for the corrected wording and links.

The `publish.yml` workflow validates the tag, reruns the full production browser matrix and packaging checks, and publishes to npm using trusted publishing. Merging a pull request alone does not publish. Draft releases and prereleases do not publish. If publishing fails, fix the cause and rerun the failed jobs from GitHub Actions.

Before the first automated release, configure a GitHub Actions trusted publisher in the npm package settings:

- Organization or user: `br-schneider`
- Repository: `nextjs-nav-guard`
- Workflow filename: `publish.yml`
- Environment: leave blank
- Allow direct publishing with `npm publish`

No npm token or GitHub secret is needed. npm requires account authentication for this one-time setup. See [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).

## Native Safari verification

Tested with Safari 27.0 on macOS on September 19, 2026. In the form demo, entering text and pressing Command-W opened Safari's native confirmation. Choosing Stay on Page preserved the page and text. In a separate dirty-tab attempt, choosing Leave Page closed the tab. Cross-site navigation could leave without a prompt, including from the independent `example/public/unload-control.html` reproduction. Playwright WebKit 26.5 reproduced that behavior with user activation present and without dispatching `beforeunload`.

To recheck, start the example and open `/` in Safari. Enter text, close the tab, cancel, and verify the text remains. Interact with the form again before checking another prompt because browsers can consume activation. Check external navigation separately. Open `/unload-control.html` to compare against a plain browser listener without the library. Do not turn a missing prompt into a claim that a navigation path is protected.
