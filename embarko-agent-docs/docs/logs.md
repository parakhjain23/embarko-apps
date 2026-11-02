---
title: Logs
requires: [deploy]
---

# Logs

The recent output of a server app, or the failed build's log when the last deploy failed.

**Call:** `GET https://ship.embarko.ai/apps/<app-name>/logs?stream=stderr`. Auth: same as [status](status).

## Steps

1. Read stderr, then stdout:

```bash
curl -sS "https://ship.embarko.ai/apps/my-app/logs?stream=stderr" -H "Authorization: Bearer $DEPLOY_TOKEN"
curl -sS "https://ship.embarko.ai/apps/my-app/logs" -H "Authorization: Bearer $DEPLOY_TOKEN"
```

Reply:

```json
{ "available": true, "source": "build", "stream": "combined", "logs": "...", "capturedAt": "2026-10-09T10:00:00.000Z",
  "next": "These are the latest build logs: fix what they name and redeploy with the same name.",
  "links": { "feedback": "https://ship.embarko.ai/apps/my-app/customer-query" } }
```

Runtime logs have `allocId` and `stream` instead of `source`. `available: false` carries a `reason` and means nothing has run yet: check status.

2. Match the signature:

| In the log | Cause | Fix |
| --- | --- | --- |
| `exit code: 127` | Command not found in the build | Add the tool to dependencies, or package the subfolder named in the deploy error. |
| `OOM Killed`, `Exit Code: 137` | Over 256MB | Production start command, drop unused dependencies. |
| `EADDRINUSE`, binds `localhost` | Wrong port or host | Read `PORT`, bind `0.0.0.0`. |
| `ENOENT` on a data path | Wrote outside `DATA_DIR` | Move the path ([data](data)). |
| `Not Restarting`, `Exceeded allowed attempts` | Crash loop | The real cause is above this line. |

3. Fix the code, redeploy with the same name.

## Limits

- Snapshot of about the last 8KB. Call again to follow.
- No long-term retention.
- Static sites have no logs: the reply is `available: false` with `status: "not_available"`.

## Errors

Same as [status](status): `invalid_app_name` 400, `unauthorized` 401, `not_found` 404, `lookup_failed` 502.

Say: "Your app couldn't start because of a code error. I'm fixing it now."
