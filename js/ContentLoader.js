// ContentLoader.js

class ContentLoader {
  constructor() {
    this.cache = new Map();
  }

  async load(pageId) {
    if (this.cache.has(pageId)) {
      return this.cache.get(pageId);
    }
    try {
      const res = await fetch(`pages/${pageId}.html`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const html = await res.text();
      this.cache.set(pageId, html);
      return html;
    } catch (err) {
      console.error(`Failed to load content for ${pageId}:`, err);
      return `<div class="content-error"><p>Failed to load content. Please make sure the local server is running.</p></div>`;
    }
  }
}

window.contentLoader = new ContentLoader();
