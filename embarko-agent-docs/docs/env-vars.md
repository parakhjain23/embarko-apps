---
title: Env vars
requires: [claim]
---

# Env vars

Sets secrets and config for a server app, then applies them to the running container.

**Call:** `https://ship.embarko.ai/api/apps/<app-name>/env-vars`. Auth: `Authorization: Bearer <deploy token>`. Send `X-Agent-Name` too.

## Steps

1. Name the keys the code reads. Ask the person only for values you cannot know (an API key). Never ask what an env var is.
2. Set one key and apply it at once:

```bash
curl -sS -X PUT "https://ship.embarko.ai/api/apps/my-app/env-vars/STRIPE_KEY" \
  -H "Authorization: Bearer $DEPLOY_TOKEN" -H "X-Agent-Name: claude" -H "Content-Type: application/json" \
  -d '{"value": "sk_live_...", "apply": true}'
```

Reply, HTTP 202:

```json
{ "key": "STRIPE_KEY", "set": true, "created": true, "applied": true, "deploymentId": "cm...", "statusUrl": "/api/apps/my-app/deployments/cm...", "terminal": false }
```

Or set several (a merge, unlisted keys are kept):

```bash
curl -sS -X PUT "https://ship.embarko.ai/api/apps/my-app/env-vars" \
  -H "Authorization: Bearer $DEPLOY_TOKEN" -H "X-Agent-Name: claude" -H "Content-Type: application/json" \
  -d '{"vars": [{"key": "A", "value": "1"}, {"key": "B", "value": "2"}], "apply": true}'
```

3. Poll `https://ship.embarko.ai` + `statusUrl` until `terminal` is true and `status` is `success`.
4. Without `"apply": true` the reply is HTTP 200 with `"applied": false, "appliesOn": "next_deploy"`. The running app does not see it until `POST .../env-vars/apply` or a redeploy. Reporting "set" without applying leaves the app broken.
5. List keys: `GET .../env-vars` returns `{ "vars": [{ "key", "set", "updatedAt" }], "valuesReadable": false }`. Values are never readable. Test the feature instead.
6. Delete: `DELETE .../env-vars/<KEY>` returns 204. Then apply.

Secrets page for the person: `https://embarko.ai/app/projects/<project-id>/environment`, where `<project-id>` is `id` from `GET https://ship.embarko.ai/api/apps/<app-name>`.

## Limits

- Keys match `^[A-Za-z_][A-Za-z0-9_]*$`.
- Static sites have no env vars.
- `PORT` and `DATA_DIR` are set by Embarko. Do not override them.

## Errors

| code | HTTP | Retry | Do |
| --- | --- | --- | --- |
| `unauthorized` | 401 | no | Token missing or invalid. |
| `app_not_found` | 404 | no | Not this token's app, or not claimed yet. |
| `app_renamed` | 404 | no | Follow `retryUrl`. |
| `invalid_env_var_key`, `validation_failed` | 400 | no | Fix the key or body. |
| `env_var_not_found` | 404 | no | Nothing to delete. |
| `not_supported_for_static` | 409 | no | Put config in the files instead. |
| `no_current_deployment` | 422 | no | Saved, not applied. Deploy the app. |
| `rename_in_progress` | 409 | later | Wait, then retry. |
| `rollback_push_failed` | 502 | once | Values saved, push failed. |

Say: "I've added the key and restarted the app. It's live again."
