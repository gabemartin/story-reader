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
`--color-accent`, etc.). This is the intended hook for future dynamic
font/scale/color controls — change values there, don't add inline styles
or one-off rules in article/index markup.

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
```

- Slugs are kebab-case, ASCII only (e.g. `articles/on-margins.html`).
- Keep paragraphs short-to-medium; use `<h2>` sparingly for subsections.
- Every article links to `../css/style.css` and has back-links both above
  and below the content.

## Adding an article

Use the `add-article` skill (`.claude/skills/add-article/`) — it creates
the article file, adds the index entry in the right position, and
publishes via git. Trigger it by asking to add/write/publish an article.
