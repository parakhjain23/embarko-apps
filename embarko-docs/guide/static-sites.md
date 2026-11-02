---
topic: static-sites
requires: []
---

# Static websites

An upload that is only files (`index.html` and assets, a `public/` folder, or a `Staticfile`) is published directly. No build, no server. Usually live within 2 seconds.

## How

Deploy it like any app ([deploy](deploy.md)). The JSON upload is handy: `{"appName", "files": [{"path": "index.html", "content": "..."}]}`.

Reply is normally `200` with `status: "live"` and `links.app`. A very large site replies `202` `publishing`: poll status every 2 seconds.

## Different from a server app

| | Static | Server |
|---|---|---|
| Build | none | yes |
| Logs | none (`available: false`) | yes |
| Env vars | refused, `409 not_supported_for_static` | yes |
| `DATA_DIR`, memory, scale to zero | none | yes |
| Domains, rollback, Showcase, analytics | yes | yes |

Replies carry `app.kind`: `static` or `service`.

## Limits

- A build-step SPA (Vite, Create React App, with a `package.json`) is built and run as a **server** app. To get the static path, deploy the built output folder as its own app.
- One way only. Server → static is allowed (the process is removed, can't be undone). Static → server is `422 app_kind_changed`: use a new name.
- Configuration goes in the files (a `config.js`). No `window.storage`: use `localStorage`.
- Response headers come from the edge. The platform's CSP (already allows WebAssembly) overrides the site's.

**Next:** deploy. Needs server code or secrets? Deploy as a server app under a new name.
