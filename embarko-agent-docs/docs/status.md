---
title: Status
requires: [deploy]
check: curl -s https://ship.embarko.ai/apps/<app-name>/status
---

# Status

Tells you where an app stands right now. Poll it after every deploy, rollback or apply.

**Call:** `GET https://ship.embarko.ai/apps/<app-name>/status`. Auth: none while the app is temporary. `Authorization: Bearer <token>` once claimed, or you get 404.

## Steps

1. Call it every 10 seconds (2 for a static site):

```bash
curl -sS https://ship.embarko.ai/apps/my-app/status -H "Authorization: Bearer $DEPLOY_TOKEN"
```

2. Branch on `status`:

| status | Meaning | Do |
| --- | --- | --- |
| `building`, `publishing` | Still working | Poll again. |
| `starting` | Built, process starting | Poll again. |
| `live` | Serving | Fetch `links.app` yourself, then report. |
| `failed` | Build failed. `error` says why | Read `links.logs` ([logs](logs)), fix, redeploy. |
| `crashed` | Built, exits on start | Usually PORT or `0.0.0.0`. Read logs, fix, redeploy. |
| `not_deployed` | Nothing under this name | Deploy. |
| `unknown` | Service restarted, no record | If `links.app` answers it is live. Else redeploy. |

3. Stop after 10 minutes of `building` and read the logs.

Reply shape:

```json
{ "status": "live",
  "app": { "name": "my-app", "kind": "service", "claimed": false, "expiresAt": "2026-10-10T09:12:00.000Z" },
  "next": "Live: give the user links.app and tell them it will be deleted at 2026-10-10T09:12:00.000Z unless claimed. To claim it, follow links.help.",
  "links": { "app": "https://my-app.embarko.app", "feedback": "https://ship.embarko.ai/apps/my-app/customer-query", "help": "https://ship.embarko.ai/capabilities/claim" } }
```

A claimed live app's `next` points `links.help` at the showcase topic instead. A sleeping app (scale to zero) is still `live` and wakes on the first request. The old `deploy.status` field is deprecated: ignore it.

## Errors

| code | HTTP | Retry | Do |
| --- | --- | --- | --- |
| `invalid_app_name` | 400 | no | Fix the name. |
| `unauthorized` | 401 | no | The token sent is invalid. |
| `not_found` | 404 | no | No app you can see. Send the owning token if claimed. |
| `lookup_failed` | 502 | yes | Transient. |

Say: "Your app is still being built. Nothing needed from you."
