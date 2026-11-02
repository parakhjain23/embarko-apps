---
topic: status
requires: [deploy]
---

# Is it live?

`GET https://ship.embarko.ai/apps/<app-name>/status` · no token while temporary, token once claimed

Only `live` means live. A `202` from the deploy does not.

## Statuses

| `status` | Final? | Do |
|---|---|---|
| `building` | no | wait, poll every 10 s |
| `publishing` | no | static site; poll every 2 s |
| `starting` | no | wait |
| `live` | yes | open the link to confirm, then tell the person. A sleeping scale-to-zero app also reads `live` |
| `failed` | yes | build failed. Read `links.logs`, fix, redeploy |
| `crashed` | yes | built but stops on start. Read logs with `stream=stderr`, fix, redeploy |
| `not_deployed` | yes | nothing under that name |
| `unknown` | no | keep polling; if it lasts 2 minutes, report it. If the URL responds, it's live |

Give up after 10 minutes: read the logs, tell the person it's taking unusually long, report it.

## Reply

```json
{ "status": "live",
  "app": { "name": "my-app", "kind": "service", "claimed": false, "expiresAt": "2026-10-10T06:50:46.326Z" },
  "next": "Live: give the user links.app and tell them it will be deleted at 2026-10-10T06:50:46.326Z unless claimed. To claim it, follow links.help.",
  "links": { "app": "https://my-app.embarko.app", "feedback": "...", "help": "https://ship.embarko.ai/capabilities/claim" } }
```

Failed replies add `error` (the cause) and `links.logs` (stderr). `deploy.status` is deprecated; read `status`. Status is in memory and shows the latest attempt; for history use `GET /api/apps/<name>/deployments`.

## Errors

| Code | Status | Do |
|---|---|---|
| `not_found` | 404 | No such app, or it's claimed and you sent no (or the wrong) token. A claimed app never confirms it exists to a non-owner |
| `unauthorized` | 401 | Token rejected |
| `lookup_failed` | 502 | Retry once |

**Say:** still building → "Still building. Nothing needed from you." · live → "Your app is live: `<link>`."
