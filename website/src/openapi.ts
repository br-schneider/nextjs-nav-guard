import { INFO_PAGES, SITE_URL } from "./site";

const documents = [
  {
    path: "/index.md",
    operationId: "readDocumentation",
    description: "Read the nextjs-nav-guard installation guide, JavaScript API reference, examples, compatibility, and limitations.",
    mediaType: "text/markdown",
  },
  {
    path: "/llms.txt",
    operationId: "readAgentGuidance",
    description: "Read when to use nextjs-nav-guard, integration steps, and links to detailed documentation.",
    mediaType: "text/plain",
  },
  ...INFO_PAGES.map((page) => ({
    path: `${page.path}.md`,
    operationId: `read${page.label}`,
    description: page.description,
    mediaType: "text/markdown",
  })),
];

export const OPENAPI = {
  openapi: "3.1.0",
  info: {
    title: "nextjs-nav-guard documentation HTTP interface",
    version: "1.0.0",
    description: "Read-only access to public documentation. No authentication or API key is required. These endpoints return text documents; the navigation guard itself is an npm library that runs in your application.",
    license: { name: "MIT" },
  },
  servers: [{ url: SITE_URL }],
  security: [],
  paths: Object.fromEntries(documents.map((document) => [document.path, {
    get: {
      operationId: document.operationId,
      summary: document.description,
      description: document.description,
      responses: {
        "200": {
          description: "The requested public document.",
          content: {
            [document.mediaType]: { schema: { type: "string" } },
          },
        },
      },
    },
  }])),
};
