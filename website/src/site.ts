export const SITE_URL = "https://nextjs-nav-guard.vercel.app";
export const REPO_URL = "https://github.com/br-schneider/nextjs-nav-guard";
export const NPM_URL = "https://www.npmjs.com/package/nextjs-nav-guard";
export const DESCRIPTION =
  "Prevent accidental navigation away from unsaved changes in Next.js App Router.";

export const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": ["SoftwareApplication", "SoftwareSourceCode"],
  "@id": `${SITE_URL}/#software`,
  name: "nextjs-nav-guard",
  description: DESCRIPTION,
  url: SITE_URL,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  programmingLanguage: "TypeScript",
  runtimePlatform: "Next.js App Router",
  codeRepository: REPO_URL,
  downloadUrl: NPM_URL,
  license: `${REPO_URL}/blob/main/LICENSE`,
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: {
    "@type": "Person",
    name: "Brett Schneider",
    url: "https://github.com/br-schneider",
  },
  sameAs: [REPO_URL, NPM_URL],
};

export const INFO_PAGES = [
  {
    path: "/about",
    label: "About",
    title: "About nextjs-nav-guard",
    description: "The project, maintainer, and source behind nextjs-nav-guard.",
    paragraphs: [
      "nextjs-nav-guard is an open-source TypeScript library for protecting unsaved changes in Next.js App Router applications. It provides NavigationGuardProvider and useNavigationGuard so a form or editor can ask for confirmation before the user leaves. The documentation covers setup, custom confirmation dialogs, navigation types, and browser limitations.",
      "Brett Schneider maintains this package as a fork of next-navigation-guard, originally created by LayerX Inc. This fork focuses on the App Router. Pages Router support has been removed. The source, changes, and issue tracker are public on GitHub, and the package is distributed through npm under the MIT license.",
      "Use the compatibility and limitations sections in the documentation when evaluating the library for your application. Navigation guards help prevent accidental data loss, but do not save form data or replace application authorization. Check the source and test the navigation paths your application uses before shipping an integration.",
    ],
    links: [
      { label: "Source and project history", href: REPO_URL },
      { label: "Package on npm", href: NPM_URL },
      { label: "Compatibility and limitations", href: "/#limitations" },
    ],
  },
  {
    path: "/contact",
    label: "Contact",
    title: "Contact and support for nextjs-nav-guard",
    description: "Report bugs, request features, and contact the package maintainer.",
    paragraphs: [
      "For bugs, feature requests, and documentation corrections, use the nextjs-nav-guard issue tracker on GitHub. Brett Schneider maintains this fork. Search existing issues before opening a new one so related reports and workarounds stay together. The repository is also the place to propose code changes through a pull request.",
      "A useful bug report includes your Next.js, React, and nextjs-nav-guard versions, the navigation action that triggered the problem, and what you expected to happen. Include a minimal reproduction when possible. Say whether you use a confirm callback or a custom dialog, and whether the problem involves a link, a router method, browser history, or a page unload.",
      "GitHub issues are public. Remove credentials, private URLs, and customer data from reproductions before posting. For a private project question, use the maintainer email published with the npm package. This is an open-source project, and support is handled through the repository without a guaranteed response time.",
    ],
    links: [
      { label: "GitHub issues", href: `${REPO_URL}/issues` },
      { label: "Email Brett Schneider", href: "mailto:brett.c.schneider@gmail.com" },
      { label: "API reference", href: "/#api" },
    ],
  },
  {
    path: "/privacy",
    label: "Privacy",
    title: "Privacy on the nextjs-nav-guard documentation site",
    description: "How the documentation site and library handle data and external services.",
    paragraphs: [
      "This documentation site has no account registration, contact form, or payment flow. Its application code does not set tracking cookies or include an analytics SDK. The nextjs-nav-guard library runs inside the application that installs it. It intercepts browser navigation and calls the callbacks you provide; it does not send your form contents to a nextjs-nav-guard service.",
      "The site is hosted on Vercel. Like other hosting providers, Vercel receives request information when you visit, which can include your IP address, browser information, and requested URL. The site loads syntax-highlighting scripts and styles from jsDelivr, so your browser also makes requests to that service. Those providers control how they handle their own request data.",
      "The documentation server requests the package version and aggregate download counts from npm to display package statistics. Links to GitHub and npm take you to those services, which have their own privacy practices. If you open a GitHub issue, the content you post is public. For questions about this site's behavior, contact the maintainer through the contact page.",
    ],
    links: [
      { label: "Contact the maintainer", href: "/contact" },
      { label: "Inspect the website source", href: `${REPO_URL}/tree/main/website` },
    ],
  },
];
