# Story Reader

A static site of articles — plain HTML/CSS, no build step. Published at
https://gabemartin.github.io/story-reader/.

## Local preview

From the project root:

```bash
python3 -m http.server 4321 --bind 0.0.0.0
```

Then open:

- **On this machine:** http://127.0.0.1:4321/
- **On another device on your network:** http://<your-lan-ip>:4321/

Find your LAN IP on macOS:

```bash
ipconfig getifaddr en0
```

The `--bind 0.0.0.0` flag is required so other devices can reach the server.
Without it, Python only listens on localhost.

Refresh the browser after editing — the built-in server does not auto-reload.

## Editing over SSH

If you edit files on a remote dev machine via SSH but browse on your laptop,
forward the port when you connect:

```bash
ssh -L 4321:localhost:4321 user@your-dev-machine
```

Start the server on the dev machine (command above), then open
http://localhost:4321/ in your local browser.

## Project layout

| Path | Purpose |
|------|---------|
| `index.html` | Article list (newest first) |
| `articles/<slug>.html` | One file per article |
| `css/style.css` | All styling |

Typography and colors are controlled by CSS custom properties in
`:root` inside `css/style.css`.

## Publishing

Push to the `main` branch. GitHub Pages serves the repo root at the URL above.
