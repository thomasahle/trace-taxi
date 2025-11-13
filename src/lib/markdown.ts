import { marked } from "marked";
import hljs from "highlight.js";

// Configure marked once with safe defaults
marked.setOptions({
  // Sanitize HTML by default to prevent XSS
  // This escapes HTML tags instead of rendering them
  // For safe HTML rendering, use marked.use({ renderer: ... }) with allowlist
  gfm: true,
  breaks: true,
  highlight: (code: string, lang: string) => {
    try {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
    } catch {}
    return hljs.highlightAuto(code).value;
  },
});

// Create a custom renderer that sanitizes HTML
const renderer = new marked.Renderer();

// Override HTML rendering to escape it
const originalHtml = renderer.html.bind(renderer);
renderer.html = (html: string) => {
  // Escape HTML to prevent XSS
  return html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

marked.use({ renderer });

export { marked };
