import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { jsxRenderer } from "hono/jsx-renderer";
import { raw } from "hono/html";
import docsMarkdown from "./docs.md?raw";
import { CodeBlock } from "./CodeBlock";
import agentInstructions from "./llms.txt?raw";
import { OPENAPI } from "./openapi";
import { DESCRIPTION, INFO_PAGES, NPM_URL, REPO_URL, SITE_URL, STRUCTURED_DATA } from "./site";

const app = new Hono();

const FIRST_PUBLISH_DATE = "2026-03-18";
const LAST_UPDATED = "2026-09-22";

type NpmStats = { version: string | null; downloads: number | null };

const STATS_TTL_MS = 6 * 60 * 60 * 1000;
const STATS_RETRY_MS = 5 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const RANGE_CHUNK_MS = 500 * DAY_MS;

let statsCache: { stats: NpmStats; expires: number } | null = null;

const fetchJson = async (url: string) => {
  const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
  if (!res.ok) throw new Error(`${url} responded ${res.status}`);
  return res.json();
};

const fetchLatestVersion = async (): Promise<string> => {
  const body = await fetchJson(
    "https://registry.npmjs.org/nextjs-nav-guard/latest"
  );
  return String(body.version);
};

const fetchTotalDownloads = async (): Promise<number> => {
  let total = 0;
  let start = new Date(`${FIRST_PUBLISH_DATE}T00:00:00Z`).getTime();
  const today = Date.now();
  while (start <= today) {
    const end = Math.min(start + RANGE_CHUNK_MS, today);
    const from = new Date(start).toISOString().slice(0, 10);
    const to = new Date(end).toISOString().slice(0, 10);
    const body = await fetchJson(
      `https://api.npmjs.org/downloads/point/${from}:${to}/nextjs-nav-guard`
    );
    total += Number(body.downloads) || 0;
    start = end + DAY_MS;
  }
  return total;
};

const getNpmStats = async (): Promise<NpmStats> => {
  if (statsCache && Date.now() < statsCache.expires) return statsCache.stats;
  const [version, downloads] = await Promise.all([
    fetchLatestVersion().catch(() => null),
    fetchTotalDownloads().catch(() => null),
  ]);
  const stats = { version, downloads };
  const ttl =
    version === null || downloads === null ? STATS_RETRY_MS : STATS_TTL_MS;
  statsCache = { stats, expires: Date.now() + ttl };
  return stats;
};

const LINK_HEADER = [
  `<${SITE_URL}/index.md>; rel="alternate"; type="text/markdown"`,
  `<${SITE_URL}/llms.txt>; rel="describedby"; type="text/plain"`,
  `<${SITE_URL}/openapi.json>; rel="service-desc"; type="application/vnd.oai.openapi+json"`,
  `<${REPO_URL}>; rel="describedby"`,
  `<${REPO_URL}/blob/main/LICENSE>; rel="license"`,
].join(", ");

const ROBOTS_TXT = `User-agent: *
Allow: /
Content-Signal: search=yes, ai-input=yes, ai-train=yes

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: CCBot
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

const SITEMAP_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${["/", ...INFO_PAGES.map((page) => page.path)].map((path) => `  <url>
    <loc>${SITE_URL}${path}</loc>
    <lastmod>${LAST_UPDATED}</lastmod>
  </url>`).join("\n")}
</urlset>
`;

const wantsMarkdown = (accept: string | undefined) =>
  (accept ?? "").toLowerCase().includes("text/markdown");

app.use("/favicon.svg", serveStatic({ root: "./public" }));
app.use("/styles.css", serveStatic({ root: "./public" }));

app.use("/social-card.png", serveStatic({ root: "./public" }));

app.get("*", jsxRenderer(({ children }, c) => {
  const page = INFO_PAGES.find((page) => page.path === c.req.path);
  const title = page?.title ?? "nextjs-nav-guard | Next.js navigation guard documentation";
  const description = page?.description ?? DESCRIPTION;
  const canonical = `${SITE_URL}${page?.path ?? "/"}`;

  return (
    <html lang="en" class="dark">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:site_name" content="nextjs-nav-guard" />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={`${SITE_URL}/social-card.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="nextjs-nav-guard: protect unsaved changes in Next.js App Router" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="alternate" type="text/markdown" href={page ? `${page.path}.md` : "/index.md"} />
        <link rel="help" href="/llms.txt" type="text/plain" />
        <link rel="service-desc" href="/openapi.json" type="application/vnd.oai.openapi+json" />
        {c.req.path === "/" && <script type="application/ld+json">{raw(JSON.stringify(STRUCTURED_DATA).replace(/</g, "\\u003c"))}</script>}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11/build/styles/github-dark.min.css" />
        <link rel="stylesheet" href="/styles.css" />
        <script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11/build/highlight.min.js"></script>
        <script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11/build/languages/typescript.min.js"></script>
        <script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11/build/languages/xml.min.js"></script>
        <script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11/build/languages/diff.min.js"></script>
        <script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11/build/languages/bash.min.js"></script>
        {raw(`<script>
          document.addEventListener('DOMContentLoaded', () => {
            if (window.hljs) hljs.highlightAll();
            document.querySelectorAll('.code-block').forEach(block => {
              const button = block.querySelector('.copy-code');
              const code = block.querySelector('code');
              const label = button.querySelector('span');
              let reset;
              button.disabled = false;
              button.addEventListener('click', async () => {
                clearTimeout(reset);
                try {
                  await navigator.clipboard.writeText(code.textContent);
                  label.textContent = 'Copied!';
                } catch {
                  const range = document.createRange();
                  range.selectNodeContents(code);
                  const selection = window.getSelection();
                  selection.removeAllRanges();
                  selection.addRange(range);
                  label.textContent = 'Selected';
                }
                reset = setTimeout(() => { label.textContent = 'Copy'; }, 2000);
              });
            });
            const btn = document.getElementById('menu-btn');
            const menu = document.getElementById('mobile-menu');
            if (btn && menu) {
              btn.addEventListener('click', () => { menu.classList.toggle('hidden'); btn.setAttribute('aria-expanded', String(!menu.classList.contains('hidden'))); });
              menu.querySelectorAll('a').forEach(a =>
                a.addEventListener('click', () => { menu.classList.add('hidden'); btn.setAttribute('aria-expanded', 'false'); })
              );
            }
          });
        </script>`)}
      </head>
      <body class="bg-surface text-gray-400 antialiased font-mono text-sm leading-relaxed">
        {/* Navigation */}
        <nav class="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md border-b border-white/[0.06]">
          <div class="max-w-3xl mx-auto px-6 h-12 flex items-center justify-between">
            <a href="/" class="text-sm text-gray-300 hover:text-white transition-colors">
              nextjs-nav-guard
            </a>
            <div class="hidden md:flex items-center gap-5">
              <a href="/#install" class="text-xs text-gray-400 hover:text-gray-300 transition-colors">install</a>
              <a href="/#usage" class="text-xs text-gray-400 hover:text-gray-300 transition-colors">usage</a>
              <a href="/#api" class="text-xs text-gray-400 hover:text-gray-300 transition-colors">api</a>
              <a href={NPM_URL} target="_blank" class="text-xs text-gray-400 hover:text-gray-300 transition-colors">npm</a>
              <a href="https://github.com/br-schneider/nextjs-nav-guard" target="_blank" class="text-xs text-gray-400 hover:text-gray-300 transition-colors">github</a>
            </div>
            <button id="menu-btn" class="md:hidden p-1 text-gray-400 hover:text-gray-300" aria-label="Toggle menu" aria-expanded="false" aria-controls="mobile-menu">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
          </div>
          <div id="mobile-menu" class="hidden md:hidden border-t border-white/[0.06] bg-surface/95 backdrop-blur-md">
            <div class="px-6 py-3 space-y-1">
              <a href="/#install" class="block py-1.5 text-xs text-gray-400 hover:text-gray-300 transition-colors">install</a>
              <a href="/#usage" class="block py-1.5 text-xs text-gray-400 hover:text-gray-300 transition-colors">usage</a>
              <a href="/#api" class="block py-1.5 text-xs text-gray-400 hover:text-gray-300 transition-colors">api</a>
              <a href={NPM_URL} target="_blank" class="block py-1.5 text-xs text-gray-400 hover:text-gray-300 transition-colors">npm</a>
              <a href="https://github.com/br-schneider/nextjs-nav-guard" target="_blank" class="block py-1.5 text-xs text-gray-400 hover:text-gray-300 transition-colors">github</a>
            </div>
          </div>
        </nav>

        <main class="max-w-3xl mx-auto px-6 pt-20">
          {children}
        </main>

        <footer class="max-w-3xl mx-auto px-6 py-10 mt-8 text-center text-xs text-gray-400">
          <p>Maintained by <a href="https://github.com/br-schneider">Brett Schneider</a>. MIT license. Originally created by <a href="https://github.com/LayerXcom" target="_blank" class="text-gray-400 hover:text-gray-300 transition-colors">LayerX Inc.</a></p>
          <div class="mt-4 flex flex-wrap justify-center gap-4">
            {INFO_PAGES.map((page) => <a href={page.path} class="text-gray-400 hover:text-gray-300 transition-colors">{page.label}</a>)}
            <a href="/index.md" class="text-gray-400 hover:text-gray-300 transition-colors">Markdown docs</a>
            <a href="/llms.txt" class="text-gray-400 hover:text-gray-300 transition-colors">llms.txt</a>
          </div>
        </footer>
        {process.env.VERCEL === "1" && (
          <>
            <script>{raw("window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };")}</script>
            <script defer src="/_vercel/insights/script.js"></script>
          </>
        )}
      </body>
    </html>
  );
}));

app.get("/robots.txt", (c) =>
  c.text(ROBOTS_TXT, 200, { "content-type": "text/plain; charset=utf-8" })
);

app.get("/sitemap.xml", (c) =>
  c.body(SITEMAP_XML, 200, { "content-type": "application/xml; charset=utf-8" })
);

app.get("/llms.txt", (c) => c.text(agentInstructions));
app.get("/openapi.json", (c) => c.json(OPENAPI));

app.on("GET", ["/index.md", "/llms-full.txt"], (c) =>
  c.body(docsMarkdown, 200, { "content-type": "text/markdown; charset=utf-8", link: LINK_HEADER })
);


for (const page of INFO_PAGES) {
  const markdown = `# ${page.title}\n\n${page.paragraphs.join("\n\n")}\n\n${page.links.map((link) => `- [${link.label}](${new URL(link.href, SITE_URL).href})`).join("\n")}\n`;
  app.on("GET", [page.path, `${page.path}.md`], (c) => {
    c.header("vary", "Accept");
    if (c.req.path.endsWith(".md") || wantsMarkdown(c.req.header("accept"))) {
      return c.body(markdown, 200, { "content-type": "text/markdown; charset=utf-8" });
    }
    return c.render(
      <section class="py-16">
        <h1 class="text-2xl text-gray-200 tracking-tight">{page.title}</h1>
        {page.paragraphs.map((paragraph) => <p class="mt-6">{paragraph}</p>)}
        <ul class="mt-6 space-y-1">
          {page.links.map((link) => <li><a href={link.href} class="text-gray-300 hover:text-white transition-colors">{link.label}</a></li>)}
        </ul>
      </section>
    );
  });
}

app.get("/", async (c) => {
  if (wantsMarkdown(c.req.header("accept"))) {
    return c.body(docsMarkdown, 200, {
      "content-type": "text/markdown; charset=utf-8",
      link: LINK_HEADER,
      vary: "Accept",
    });
  }

  const stats = await getNpmStats();

  c.header("link", LINK_HEADER);
  c.header("vary", "Accept");

  return c.render(
    <>
      {/* Hero */}
      <section class="py-16 md:py-24">
        <h1 class="text-2xl md:text-3xl text-gray-200 tracking-tight">
          nextjs-nav-guard
        </h1>
        <p class="mt-3 text-gray-400 max-w-lg leading-relaxed">
          Prevent accidental navigation away from unsaved changes in Next.js App Router.
          Protect forms and editors with a provider and a hook.
        </p>
        <div class="mt-5 flex items-center gap-2 flex-wrap text-xs text-gray-400">
          {stats.version && (
            <>
              <a href={NPM_URL} target="_blank" class="hover:text-gray-300 transition-colors">
                v{stats.version}
              </a>
              <span class="text-gray-700">·</span>
            </>
          )}
          {stats.downloads != null && (
            <>
              <a href={NPM_URL} target="_blank" class="hover:text-gray-300 transition-colors">
                {stats.downloads.toLocaleString("en-US")} downloads
              </a>
              <span class="text-gray-700">·</span>
            </>
          )}
          <span>MIT license</span>
        </div>
        <div class="mt-6 flex gap-4 text-xs">
          <a href="/#install" class="text-gray-300 hover:text-white transition-colors">[get started]</a>
          <a href={NPM_URL} target="_blank" class="text-gray-400 hover:text-gray-300 transition-colors">[npm]</a>
          <a href="https://github.com/br-schneider/nextjs-nav-guard" target="_blank" class="text-gray-400 hover:text-gray-300 transition-colors">[github]</a>
        </div>
      </section>

      {/* Install */}
      <section id="install" class="py-10 md:py-14">
        <h2 class="text-sm text-gray-300 mb-4">Install</h2>
        <CodeBlock language="bash" filename="Terminal">npm install nextjs-nav-guard</CodeBlock>
      </section>

      {/* Features */}
      <section class="py-10 md:py-14">
        <h2 class="text-sm text-gray-300 mb-4">What it intercepts</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-px border border-white/[0.08] bg-white/[0.08]">
          <div class="bg-surface p-4">
            <h3 class="text-gray-300 text-xs mb-1">Router methods</h3>
            <p class="text-gray-400 text-xs"><code>router.push()</code>, <code>router.replace()</code>, <code>router.refresh()</code></p>
          </div>
          <div class="bg-surface p-4">
            <h3 class="text-gray-300 text-xs mb-1">Link clicks</h3>
            <p class="text-gray-400 text-xs">Next.js <code>&lt;Link&gt;</code> and plain <code>&lt;a&gt;</code> tags</p>
          </div>
          <div class="bg-surface p-4">
            <h3 class="text-gray-300 text-xs mb-1">Browser navigation</h3>
            <p class="text-gray-400 text-xs">Back/forward buttons, <code>history.go()</code></p>
          </div>
          <div class="bg-surface p-4">
            <h3 class="text-gray-300 text-xs mb-1">Page unload</h3>
            <p class="text-gray-400 text-xs">Tab close, <code>window.location</code> changes</p>
          </div>
        </div>
      </section>

      {/* Usage */}
      <section id="usage" class="py-10 md:py-14">
        <h2 class="text-sm text-gray-300 mb-4">Quick start</h2>
        <p class="text-gray-400 mb-3">1. Mount the provider unconditionally in your root layout:</p>
        <CodeBlock language="tsx" filename="app/layout.tsx">{`// app/layout.tsx
import { NavigationGuardProvider } from "nextjs-nav-guard";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NavigationGuardProvider>{children}</NavigationGuardProvider>
      </body>
    </html>
  );
}`}</CodeBlock>

        <p class="text-gray-400 mt-8 mb-4">2. Use the hook in any component with unsaved changes:</p>
        <CodeBlock language="tsx" filename="NameForm.tsx">{`"use client";

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
}`}</CodeBlock>
        <p class="text-gray-400 mt-4">Mount the provider unconditionally. Put loading screens and session checks inside it so browser history protection is installed early.</p>
      </section>

      {/* Custom Dialog */}
      <section id="custom-dialog" class="py-10 md:py-14">
        <h2 class="text-sm text-gray-300 mb-4">Custom dialog UI</h2>
        <p class="text-gray-400 mb-3">
          Omit the <code>confirm</code> callback to use async mode. The hook returns <code>active</code>, <code>accept</code>,
          and <code>reject</code> so you can render your own confirmation dialog:
        </p>
        <CodeBlock language="tsx" filename="NoteForm.tsx">{`"use client";

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
}`}</CodeBlock>
      </section>

      {/* Conditional */}
      <section id="conditional" class="py-10 md:py-14">
        <h2 class="text-sm text-gray-300 mb-4">Conditional guard</h2>
        <p class="text-gray-400 mb-3">
          The <code>enabled</code> option accepts a function that receives the navigation type,
          so you can guard selectively:
        </p>
        <CodeBlock language="tsx" filename="Conditional guard">{`useNavigationGuard({
  enabled: ({ type }) => {
    // Only guard against link clicks and back/forward, not refresh
    return type !== "refresh" && type !== "beforeunload";
  },
  confirm: () => window.confirm("Discard changes?"),
});`}</CodeBlock>
      </section>

      {/* API Reference */}
      <section id="api" class="py-10 md:py-14">
        <h2 class="text-sm text-gray-300 mb-4">API reference</h2>

        <h3 class="text-sm text-gray-300 mt-8 mb-2"><code>&lt;NavigationGuardProvider&gt;</code></h3>
        <p class="text-gray-400 mb-3">
          Wrap your app with this provider in your root layout. No props required other than <code>children</code>.
          It sets up interception of all navigation methods listed above.
        </p>

        <h3 class="text-sm text-gray-300 mt-8 mb-2"><code>useNavigationGuard(options)</code></h3>
        <p class="text-gray-400 mb-3">Register a navigation guard. Returns an object with <code>active</code>, <code>accept</code>, and <code>reject</code>.</p>
        <p class="text-gray-400 mb-3">This is the JavaScript API for the npm library. It runs in your application and requires no hosted service or API key.</p>

        <h4 class="text-xs text-gray-400 mt-6 mb-2">Options</h4>
        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left">
            <thead>
              <tr class="border-b border-white/[0.06]">
                <th class="py-2.5 pr-4 text-gray-400 font-normal">Option</th>
                <th class="py-2.5 pr-4 text-gray-400 font-normal">Type</th>
                <th class="py-2.5 pr-4 text-gray-400 font-normal">Default</th>
                <th class="py-2.5 text-gray-400 font-normal">Description</th>
              </tr>
            </thead>
            <tbody class="text-gray-400">
              <tr class="border-b border-white/[0.04]">
                <td class="py-2.5 pr-4"><code>enabled</code></td>
                <td class="py-2.5 pr-4"><code>boolean | (params) =&gt; boolean</code></td>
                <td class="py-2.5 pr-4"><code>true</code></td>
                <td class="py-2.5">Whether the guard is active. Can be a function receiving navigation params.</td>
              </tr>
              <tr class="border-b border-white/[0.04]">
                <td class="py-2.5 pr-4"><code>confirm</code></td>
                <td class="py-2.5 pr-4"><code>(params) =&gt; boolean | Promise&lt;boolean&gt;</code></td>
                <td class="py-2.5 pr-4"><code>undefined</code></td>
                <td class="py-2.5">Confirmation callback. Return <code>true</code> to allow, <code>false</code> to block. If omitted, uses async mode.</td>
              </tr>
              <tr class="border-b border-white/[0.04]">
                <td class="py-2.5 pr-4"><code>disableForTesting</code></td>
                <td class="py-2.5 pr-4"><code>boolean</code></td>
                <td class="py-2.5 pr-4"><code>false</code></td>
                <td class="py-2.5">Makes the hook a no-op. No provider required. Use in tests and Storybook.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h4 class="text-xs text-gray-400 mt-6 mb-2">Return value</h4>
        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left">
            <thead>
              <tr class="border-b border-white/[0.06]">
                <th class="py-2.5 pr-4 text-gray-400 font-normal">Property</th>
                <th class="py-2.5 pr-4 text-gray-400 font-normal">Type</th>
                <th class="py-2.5 text-gray-400 font-normal">Description</th>
              </tr>
            </thead>
            <tbody class="text-gray-400">
              <tr class="border-b border-white/[0.04]">
                <td class="py-2.5 pr-4"><code>active</code></td>
                <td class="py-2.5 pr-4"><code>boolean</code></td>
                <td class="py-2.5"><code>true</code> when a navigation attempt is pending confirmation (async mode only).</td>
              </tr>
              <tr class="border-b border-white/[0.04]">
                <td class="py-2.5 pr-4"><code>accept</code></td>
                <td class="py-2.5 pr-4"><code>() =&gt; void</code></td>
                <td class="py-2.5">Allow the pending navigation.</td>
              </tr>
              <tr class="border-b border-white/[0.04]">
                <td class="py-2.5 pr-4"><code>reject</code></td>
                <td class="py-2.5 pr-4"><code>() =&gt; void</code></td>
                <td class="py-2.5">Block the pending navigation.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h4 class="text-xs text-gray-400 mt-6 mb-2">Navigation params</h4>
        <p class="text-gray-400 mb-3">Both <code>enabled</code> (when a function) and <code>confirm</code> receive:</p>
        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left">
            <thead>
              <tr class="border-b border-white/[0.06]">
                <th class="py-2.5 pr-4 text-gray-400 font-normal">Property</th>
                <th class="py-2.5 pr-4 text-gray-400 font-normal">Type</th>
                <th class="py-2.5 text-gray-400 font-normal">Description</th>
              </tr>
            </thead>
            <tbody class="text-gray-400">
              <tr class="border-b border-white/[0.04]">
                <td class="py-2.5 pr-4"><code>to</code></td>
                <td class="py-2.5 pr-4"><code>string</code></td>
                <td class="py-2.5">The target URL.</td>
              </tr>
              <tr class="border-b border-white/[0.04]">
                <td class="py-2.5 pr-4"><code>type</code></td>
                <td class="py-2.5 pr-4"><code>"push" | "replace" | "refresh" | "popstate" | "beforeunload"</code></td>
                <td class="py-2.5">How the navigation was triggered.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h4 class="text-xs text-gray-400 mt-6 mb-2">Type exports</h4>
        <CodeBlock language="typescript" filename="types.ts">{`import type {
  NavigationGuard,         // (params: NavigationGuardParams) => boolean | Promise<boolean>
  NavigationGuardOptions,  // { enabled?, confirm?, disableForTesting? }
  NavigationGuardParams,   // { to: string; type: "push" | "replace" | ... }
} from "nextjs-nav-guard";`}</CodeBlock>
      </section>

      <section id="community" class="py-10 md:py-14">
        <h2 class="text-sm text-gray-300 mb-4">Build this with us</h2>
        <p class="mb-4">Maintained by <a href="https://github.com/br-schneider">Brett Schneider</a>, based on the work of LayerX and its contributors. Reproductions, tests, and documentation are welcome.</p>
        <div class="flex flex-wrap gap-4">
          <a href={`${REPO_URL}/blob/main/CONTRIBUTING.md`}>Contribute</a>
          <a href={`${REPO_URL}/blob/main/ROADMAP.md`}>Roadmap</a>
          <a href={`${REPO_URL}/discussions`}>Questions and ideas</a>
          <a href={`${REPO_URL}/tree/main/example`}>Run the form demo</a>
        </div>
      </section>

      <section id="guarded-links" class="py-10 md:py-14">
        <h2 class="text-sm text-gray-300 mb-4">Links with options and callbacks</h2>
        <p class="mb-4"><strong>Version note:</strong> This component and the navigation concurrency fixes below require version 1.1.0 or later. They are not included in 1.0.9. See the <a href={`${REPO_URL}/blob/main/CHANGELOG`}>changelog</a> for release details.</p>
        <p class="mb-4">Use <code>NavigationGuardLink</code> to preserve replacement history, scroll control, and click or navigation callbacks. Existing guards work with this component.</p>
        <CodeBlock language="tsx" filename="SettingsLink.tsx">{`import { NavigationGuardLink } from "nextjs-nav-guard";

export default function SettingsLink() {
  return <NavigationGuardLink href="/settings" replace scroll={false}>Settings</NavigationGuardLink>;
}`}</CodeBlock>
        <p class="mt-4">The first pending navigation owns the confirmation. Further attempts are blocked until it settles. Unmounting or disabling a guard cancels its pending attempt.</p>
        <p class="mt-4">Starting with version 1.1.1, changes to the registered guards cancel the pending attempt when confirmation finishes. Start a new navigation to check the current guards. Accepted links also preserve a configured Next.js <code>basePath</code> without adding it twice.</p>
        <p class="mt-4">For saving before navigation, see the <a href={`${REPO_URL}/blob/main/example/src/components/FormDemo.tsx`}>complete form demo</a>. Only mark the form clean after saving succeeds.</p>
      </section>

      <section id="limitations" class="py-10 md:py-14">
        <h2 class="text-sm text-gray-300 mb-4">Limitations</h2>

        <h3 class="text-sm text-gray-300 mt-8 mb-2">Reloads and tab closes use the browser dialog</h3>
        <p class="text-gray-400 mb-3">
          Custom dialog UIs only work for client-side navigations. When the browser fires <code>beforeunload</code> (page
          reload, tab close, leaving for another site), browsers do not allow async work or custom UI. The library can only
          request the browser's built-in confirmation dialog, and its text and appearance cannot be customized.
        </p>

        <h3 class="text-sm text-gray-300 mt-8 mb-2">Safari can bypass external-navigation prompts</h3>
        <p class="text-gray-400 mb-4 leading-relaxed">
          Safari 27.0 and Playwright WebKit 26.5 allowed cross-site navigation without firing beforeunload in our checks,
          including on a plain HTML page without this library. Tab-close confirmation passed separately.
          Save drafts independently when losing work would be costly; unload protection is not guaranteed for external links or address-bar navigation.
        </p>

        <h3 class="text-sm text-gray-300 mt-8 mb-2">Direct History API calls are not guarded</h3>
        <p class="text-gray-400 mb-3">
          Calls made directly through <code>window.history.pushState()</code> or <code>window.history.replaceState()</code> bypass
          the guard. If you call either method yourself, confirm the navigation before calling it.
        </p>

        <h3 class="text-sm text-gray-300 mt-8 mb-2">Guarded link clicks are handled programmatically</h3>
        <p class="text-gray-400 mb-3">
          To intercept <code>&lt;Link&gt;</code> and <code>&lt;a&gt;</code> clicks, the provider registers a capture-phase click
          handler. While a guard is enabled, that handler prevents the original click and stops its propagation while the
          confirmation is pending, then navigates via the App Router if accepted. Use <code>NavigationGuardLink</code> when you need <code>replace</code>, <code>scroll</code>, or click and navigation callbacks. The automatic interceptor cannot recover these React props.
        </p>

        <h3 class="text-sm text-gray-300 mt-8 mb-2">Provider placement matters</h3>
        <p class="mb-3">Keep the provider mounted in the root layout. Mounting it after a loading screen or async session check can let Next.js handle Back and Forward before the guard. Put conditional content inside the provider.</p>

        <h3 class="text-sm text-gray-300 mt-8 mb-2">Next.js 16.2 drops query-only replacements after an async guard</h3>
        <p class="text-gray-400 mb-3">
          Next.js 16.2 has an App Router regression: after an async guard is accepted, a <code>router.replace()</code> that
          changes only the query string may be dropped. This is a Next.js bug, fixed in Next.js 16.3.0, and the library cannot
          safely work around it. If your app uses this pattern, stay on 16.1.x or upgrade to Next.js 16.3.0 or later.
        </p>
      </section>

      {/* Compatibility */}
      <section id="compatibility" class="py-10 md:py-14">
        <h2 class="text-sm text-gray-300 mb-4">Compatibility</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left">
            <thead>
              <tr class="border-b border-white/[0.06]">
                <th class="py-2.5 pr-4 text-gray-400 font-normal">Next.js</th>
                <th class="py-2.5 pr-4 text-gray-400 font-normal">React</th>
                <th class="py-2.5 text-gray-400 font-normal">Status</th>
              </tr>
            </thead>
            <tbody class="text-gray-400">
              <tr class="border-b border-white/[0.04]">
                <td class="py-2.5 pr-4">14.x</td>
                <td class="py-2.5 pr-4">18</td>
                <td class="py-2.5">Supported</td>
              </tr>
              <tr class="border-b border-white/[0.04]">
                <td class="py-2.5 pr-4">15.x</td>
                <td class="py-2.5 pr-4">19</td>
                <td class="py-2.5">Supported</td>
              </tr>
              <tr class="border-b border-white/[0.04]">
                <td class="py-2.5 pr-4">16.x</td>
                <td class="py-2.5 pr-4">19</td>
                <td class="py-2.5">Supported. 16.2 has a known Next.js router bug, see <a href="#limitations" class="text-gray-300 hover:text-white transition-colors">limitations</a>.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Migration */}
      <section id="migration" class="py-10 md:py-14">
        <h2 class="text-sm text-gray-300 mb-4">Migrating from next-navigation-guard</h2>
        <p class="text-gray-400 mb-3">The API is identical. Just change the import:</p>
        <CodeBlock language="diff" filename="Update imports">{`- import { NavigationGuardProvider, useNavigationGuard } from "next-navigation-guard";
+ import { NavigationGuardProvider, useNavigationGuard } from "nextjs-nav-guard";`}</CodeBlock>
        <p class="text-gray-400 mt-4">If you were using Pages Router, you'll need to switch to App Router. Pages Router support has been removed.</p>
      </section>
    </>
  );
});

app.notFound((c) => {
  c.header("vary", "Accept");
  c.header("x-robots-tag", "noindex");
  if (wantsMarkdown(c.req.header("accept"))) {
    return c.body(
      `# Page not found\n\nThis page does not exist on the nextjs-nav-guard documentation site.\n\n- [Documentation](${SITE_URL}/index.md)\n- [Agent guidance](${SITE_URL}/llms.txt)\n- [Sitemap](${SITE_URL}/sitemap.xml)\n`,
      404,
      { "content-type": "text/markdown; charset=utf-8" }
    );
  }
  if (c.req.header("accept")?.includes("application/json") || c.req.path.startsWith("/api/")) {
    return c.json({
      error: {
        code: "not_found",
        message: "This document does not exist on the nextjs-nav-guard documentation site.",
        resolution: `Read ${SITE_URL}/openapi.json for available document endpoints or ${SITE_URL}/llms.txt for integration guidance.`,
      },
    }, 404);
  }
  return c.html(
    <html lang="en">
      <head><title>Page not found | nextjs-nav-guard</title></head>
      <body>
        <h1>Page not found</h1>
        <p>This page does not exist on the nextjs-nav-guard documentation site.</p>
        <a href="/">Read the documentation</a>
      </body>
    </html>,
    404
  );
});

export default app;
