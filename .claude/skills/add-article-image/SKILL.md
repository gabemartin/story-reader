---
name: add-article-image
description: Attach a pasted/provided image as the hero image of a Story Reader article and publish it. Trigger when the user pastes or attaches an image together with a link (a localhost or live article URL, or a source/recipe URL) and asks to add the image to an article.
---

# Add Article Image

Story Reader articles get a hero image by convention: save the file as
`images/<slug>.jpg` where `<slug>` matches the article filename.
`js/reader.js` probes for it on page load — no HTML edits are needed as
long as the article already has its `figure.article-art` block (all
articles created via the `add-article` skill do).

## Inputs

- **An image** — pasted images are saved by the system to the workspace
  assets folder (path appears in the message as `image-<uuid>.png`).
- **A link** identifying the target article. It can be any of:
  - a local preview URL, e.g. `http://localhost:8765/articles/<slug>.html`
  - the live URL, e.g. `https://gabemartin.github.io/story-reader/articles/<slug>.html`
  - a repo path, e.g. `articles/<slug>.html`
  - an **external source/recipe URL** — articles cite their source link
    in the body, so grep `articles/` for the URL to find the file.

## Steps

1. **Resolve the slug.**
   - Article URL/path → slug is the filename without `.html`.
   - External recipe URL → `grep -l "<url>" articles/` (match on the
     domain+path if the exact URL differs). The matching filename gives
     the slug.
   - No match → the article doesn't exist yet; follow the `add-article`
     skill first, then come back here.
   - Confirm `articles/<slug>.html` exists before continuing.

2. **Convert and save.** From the repo root:

   ```bash
   sips -s format jpeg -s formatOptions 85 <pasted-image.png> \
     --out images/<slug>.jpg
   ```

   (If the source is already a reasonably sized JPEG, a plain copy to
   `images/<slug>.jpg` is fine.)

3. **Verify.** If a local server is running (check the terminals for a
   `python3 -m http.server` process), confirm it serves:

   ```bash
   curl -s -o /dev/null -w "%{http_code}" http://localhost:<port>/images/<slug>.jpg
   ```

   Expect `200`. Otherwise just confirm the file exists on disk.

4. **Publish.**

   ```bash
   git add images/<slug>.jpg
   git commit -m "Add hero image: <slug>"
   git push
   ```

   If the user pasted several images in one message, save them all
   (repeating steps 1–3 per image) and publish in a single commit.

5. **Report back** the article's live URL:
   `https://gabemartin.github.io/story-reader/articles/<slug>.html`
   (allow a minute or two for GitHub Pages to rebuild).

## Notes

- `.png` and `.webp` also work as target extensions, but prefer `.jpg`
  for photographic images — smaller files, and it's the site default.
- Don't edit the article HTML: the `figure.article-art` block already
  handles both states (prompt card when no image, hero image when one
  exists).
