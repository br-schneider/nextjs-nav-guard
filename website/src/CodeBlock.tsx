type CodeBlockProps = {
  language: "bash" | "tsx" | "typescript" | "diff";
  filename: string;
  children: string;
};

export function CodeBlock({ language, filename, children }: CodeBlockProps) {
  return (
    <div class="code-block">
      <div class="code-block-header">
        <span class="code-block-filename">{filename}</span>
        <span class="code-block-language">
          {{ bash: "Shell", tsx: "TSX", typescript: "TypeScript", diff: "Diff" }[language]}
        </span>
        <button class="copy-code" type="button" aria-label={`Copy ${filename} code`} disabled>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <rect x="8" y="8" width="12" height="12" rx="2" />
            <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
          </svg>
          <span aria-live="polite">Copy</span>
        </button>
      </div>
      <pre tabIndex={0} role="region" aria-label={`${filename} code`}><code class={`language-${language}`}>{children}</code></pre>
    </div>
  );
}
