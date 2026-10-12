import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// The Botpress loader and bot configuration are injected into the Vite HTML
// shell's <head>. This asserts the shipped document, not a rendered component.
// Vitest runs with the frontend package as its working directory.
const indexHtml = readFileSync(resolve(process.cwd(), "index.html"), "utf8");

function headContent(html: string): string {
  const match = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  return match ? match[1] : "";
}

const head = headContent(indexHtml);

function scriptTags(html: string): string[] {
  return html.match(/<script\b[^>]*>/gi) ?? [];
}

describe("index.html Botpress injection", () => {
  it("loads the Botpress webchat loader as a script in the head", () => {
    const loaderTag = scriptTags(head).find((tag) =>
      tag.includes("https://cdn.botpress.cloud/webchat/v5.0/inject.js"),
    );
    expect(loaderTag).toBeDefined();
  });

  it("loads the Botpress bot configuration as a script in the head with defer", () => {
    const configTag = scriptTags(head).find((tag) =>
      tag.includes(
        "https://files.bpcontent.cloud/2026/10/12/20261012100153-OS9GUHSR.js",
      ),
    );
    expect(configTag).toBeDefined();
    expect(configTag).toMatch(/\bdefer\b/);
  });

  it("keeps the React root and module entry in the body", () => {
    expect(indexHtml).toContain('<div id="root"></div>');
    expect(indexHtml).toContain('src="./src/main.tsx"');
  });
});
