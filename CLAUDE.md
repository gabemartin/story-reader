# Story Reader

A static site published via GitHub Pages (root of `main` branch,
https://gabemartin.github.io/story-reader/). No build step, no JS framework —
plain HTML/CSS by design.

## Structure

- `index.html` — the article list. Newest article first.
- `articles/<slug>.html` — one file per article.
- `css/style.css` — all styling. Typography follows the readability
  approach of [Tufte CSS](https://edwardtufte.github.io/tufte-css/): a
  single serif reading column, generous line-height, minimal chrome.

## Theming

All tunable typography/color values are CSS custom properties in the
`:root` block of `css/style.css` (`--font-serif`, `--font-size-base`,
`--line-height-base`, `--measure`, `--color-bg`, `--color-text`,
`--color-accent`, etc.). Theme presets (light, dark, beige) are applied
via `data-theme` on `<html>`. Article pages load `js/reader.js`, which
provides a reading-controls panel (theme, font, size, line height,
book mode) and persists user choices in
`localStorage` — change values on `:root` for site-wide defaults, not
inline styles in article markup.

## Article markup shape

Each article in `articles/` follows this shape (see any existing file
for a full example):

```html
<article>
  <nav class="back-link"><a href="../index.html">&larr; Index</a></nav>
  <header>
    <h1>{{Title}}</h1>
    <p class="byline">{{YYYY-MM-DD}} &middot; {{optional subtitle}}</p>
  </header>

  <p>{{body paragraphs...}}</p>

  <nav class="back-link"><a href="../index.html">&larr; Index</a></nav>
</article>
<script src="../js/reader.js" defer></script>
```

- Slugs are kebab-case, ASCII only (e.g. `articles/on-margins.html`).
- Keep paragraphs short-to-medium; use `<h2>` sparingly for subsections.
- Every article links to `../css/style.css`, includes `../js/reader.js`
  (defer), and has back-links both above and below the content.
- The reader script wraps article body content automatically; no extra
  markup is required beyond the script tag.

## Article images

Each article may include a hero image. The convention is one rule:

- Save the image as `images/<slug>.jpg` (`.png` or `.webp` also work),
  where `<slug>` matches the article filename without extension.

In the article HTML, add a figure immediately after the header:

```html
<figure class="article-art" data-image-slug="<slug>">
  <p class="article-art-prompt">{{full image generation prompt}}</p>
</figure>
```

`js/reader.js` probes for the image on load. If it exists, the figure
shows the hero image with the prompt tucked into a collapsible details
element. If not, it shows a prompt card with a **Copy prompt** button.
Drop in an image file and push — no HTML changes needed.

## Adding an article

Use the `add-article` skill (`.claude/skills/add-article/`) — it creates
the article file, adds the index entry in the right position, and
publishes via git. Trigger it by asking to add/write/publish an article.
