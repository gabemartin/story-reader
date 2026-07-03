---
name: add-article
description: Add a new article to the Story Reader site (index.html + articles/) and publish it via git push to GitHub Pages. Trigger when the user asks to add, write, draft, or publish an article/essay/story, or to update an existing one.
---

# Add Article

Story Reader is a plain static HTML site (see `CLAUDE.md` at the repo root
for the full structure and typography conventions). This skill adds one
article and publishes it.

## Steps

1. **Get the content.** If the user gave a topic rather than finished
   prose, write the article yourself — aim for a few short-to-medium
   paragraphs, Tufte-style: clear, unfussy, no filler. If the user pasted
   full text, use it as-is (light copyedit only, don't rewrite their
   voice).

2. **Pick a slug and date.** Slug: kebab-case ASCII derived from the
   title (e.g. "On Margins" -> `on-margins`). Date: today, unless the
   user specifies otherwise.

3. **Create `articles/<slug>.html`** following the exact markup shape in
   `CLAUDE.md` under "Article markup shape" — copy the structure of an
   existing article in `articles/` for the boilerplate (doctype, head,
   stylesheet link, back-links top and bottom, `reader.js` script).
   Only add inline styles if the user explicitly asks; otherwise
   everything should be styled through the existing classes in
   `css/style.css`. If the user provides an image prompt, include the
   `figure.article-art` block described in `CLAUDE.md` under "Article
   images" (save the actual image later as `images/<slug>.jpg`).

4. **Add an index entry.** In `index.html`, insert a new `<li>` into
   `.article-list` in the same shape as existing entries (link, one-line
   excerpt — first sentence or ~20 words of the body, truncated with
   `&hellip;` — and a `.meta` date). Insert it in reverse-chronological
   order (newest first) — usually at the top of the list unless the
   article's date isn't the most recent.

5. **Publish.** From the repo root:
   ```
   git add index.html articles/<slug>.html
   git commit -m "Add article: <Title>"
   git push
   ```

6. **Report back** the article's live URL:
   `https://gabemartin.github.io/story-reader/articles/<slug>.html`
   (allow a minute or two for GitHub Pages to rebuild).

## Notes

- Don't touch `css/style.css` theming variables as part of adding an
  article — that's a separate concern (see CLAUDE.md's "Theming"
  section).
- If asked to edit an existing article instead of adding one, follow the
  same publish step (3 is a straight edit, no new index entry needed)
  and update the index excerpt/date only if the user asked for it.
