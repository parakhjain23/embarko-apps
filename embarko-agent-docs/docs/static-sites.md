---
title: Static sites
---

# Static sites

A plain site (an `index.html` and assets, a `public/` folder, or a `Staticfile`) is published directly. No build, no server, live within seconds.

**Call:** the same `POST https://ship.embarko.ai/apps` as [deploy](deploy).

## Steps

1. Make sure `index.html` is at the root of what you package. A folder with only `landing.html` fails.
2. Deploy as usual. The request waits up to 5 seconds for the publish. Reply, HTTP 200:

```json
{ "success": true, "status": "live",
  "app": { "name": "my-site", "kind": "static", "claimed": false, "expiresAt": "2026-10-10T09:12:00.000Z" },
  "next": "Live: give the user links.app and tell them it will be deleted at 2026-10-10T09:12:00.000Z unless claimed. To claim it, follow links.help.",
  "links": { "app": "https://my-site.embarko.app", "feedback": "https://ship.embarko.ai/apps/my-site/customer-query", "help": "https://ship.embarko.ai/capabilities/claim" } }
```

3. A large site answers HTTP 202 with `"status": "publishing"`. Poll `links.status` every 2 seconds.
4. Fetch `links.app`, then report.

## Limits

- No logs, no env vars, no memory setting, no `DATA_DIR`, no scale to zero. Writes are refused with 409 `not_supported_for_static`.
- A server app can be redeployed as a static site. A static site cannot become a server app: 422 `app_kind_changed`. Use a new name.
- A site that needs a build step (Vite, Create React App) is built and run as a server app.

## Errors

| code | HTTP | Retry | Do |
| --- | --- | --- | --- |
| `invalid_static_root` | 422 | no | Staticfile `root:` must point inside the upload. |
| `app_kind_changed` | 422 | no | Deploy under a new name. |
| `publish_failed` | 500 | once | Then report via [feedback](feedback). |

Say: "Your site is live: <url>."
