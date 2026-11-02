---
title: Rollback
requires: [claim]
---

# Rollback

Puts an earlier successful build back. No rebuild, no upload. Env vars and domains stay as they are today.

**Call:** `POST https://ship.embarko.ai/api/apps/<app-name>/rollback`. Auth: `Authorization: Bearer <deploy token>`. Send `X-Agent-Name`.

## Steps

1. Roll back to the previous good build:

```bash
curl -sS -X POST "https://ship.embarko.ai/api/apps/my-app/rollback" \
  -H "Authorization: Bearer $DEPLOY_TOKEN" -H "X-Agent-Name: claude" -H "Content-Type: application/json" -d '{}'
```

Reply, HTTP 202:

```json
{ "accepted": true, "deploymentId": "cm...new", "rolledBackTo": { "id": "cm...old", "version": "v2" },
  "statusUrl": "/api/apps/my-app/deployments/cm...new", "terminal": false }
```

2. To pick a specific version, list history first: `GET .../deployments` returns `{ "deployments": [ { "id", "version", "appVersion", "status", "isCurrent", "rollbackTarget", "createdAt", ... } ] }`, newest first. Only `rollbackTarget: true` rows are valid. Send `{"deploymentId": "<id>"}`.
3. Poll `https://ship.embarko.ai` + `statusUrl` until `terminal` is true. `status` ends `success` or `failed`.
4. Fetch the URL. Confirm the old version serves. Report.

## Limits

- Only the last 5 builds are kept.
- Rollback adds a new history entry. It does not touch `DATA_DIR`.

## Errors

| code | HTTP | Retry | Do |
| --- | --- | --- | --- |
| `no_rollback_target` | 422 | no | Nothing earlier to go back to. Fix and redeploy. |
| `rollback_not_successful_deployment` | 422 | no | Pick a `rollbackTarget: true` row. |
| `rollback_image_unavailable` | 422 | no | Older than `retainCount`. Redeploy from source. |
| `deployment_not_found` | 404 | no | Wrong id. |
| `rename_in_progress` | 409 | later | Wait. |
| `rollback_push_failed` | 502 | once | Then report. |

Say: "I've put the previous version back. It's live again at <url>. I'll fix the new version next."
