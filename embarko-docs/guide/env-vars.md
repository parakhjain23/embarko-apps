---
topic: env-vars
requires: [deploy, claim]
---

# Secrets and settings

`https://ship.embarko.ai/api/apps/<app-name>/env-vars` · token always · app must be claimed

Per-app environment variables, encrypted, visible only to that app. Values are write-only: you can list keys, never read a value back.

## Steps

1. If the value is something only the person has (their Stripe key), ask for it directly, or send them the secrets page: `https://embarko.ai/app/projects/<project-id>/environment` (`project-id` from `GET https://ship.embarko.ai/api/apps/<app-name>`).
2. Write it **with apply**, so the running app sees it:

   ```bash
   curl -sS -X PUT 'https://ship.embarko.ai/api/apps/my-app/env-vars/STRIPE_KEY' \
     -H "Authorization: Bearer $DEPLOY_TOKEN" -H 'X-Agent-Name: codex' \
     -H 'Content-Type: application/json' -d '{"value":"sk_live_...","apply":true}'
   ```

   Several at once: `PUT .../env-vars` with `{"vars":[{"key","value"}],"apply":true}`. It merges; other keys stay.
3. Confirm by behaviour (test the feature), not by reading the value back.
4. If the key was ever in the source or a packaged `.env`, remove it, redeploy, and tell the person to rotate it.

**A write without `apply` only stores the value.** Then call `POST .../env-vars/apply` or redeploy. Apply answers `202` with a `statusUrl`.

## Calls

| Call | Does |
|---|---|
| `GET /env-vars` | keys only |
| `PUT /env-vars` | set several, merge |
| `PUT /env-vars/<KEY>` | set one |
| `DELETE /env-vars/<KEY>` | remove; takes effect on next apply or deploy |
| `POST /env-vars/apply` | restart with current values, no rebuild |

## Limits

- Keys: `^[A-Za-z_][A-Za-z0-9_]*$`.
- `PORT`, `APP_NAME`, `APP_VERSION`, `DATA_DIR` are set by Embarko.
- Static sites have no env vars.
- Not a secrets manager: no rotation, no sharing between apps.

## Errors

| Code | Status | Do |
|---|---|---|
| `not_supported_for_static` | 409 | put config in the files, or deploy as a server app under a new name |
| `no_current_deployment` | 422 | values are saved. Deploy once; don't write them again |
| `invalid_env_var_key` | 400 | fix the key |
| `env_var_not_found` | 404 | delete of an unknown key |
| `unauthorized` | 401 | bad token |

**Say:** "Your app needs a key before it can work. Add it here: `<secrets page link>`" · done → "Added. Your app is using it now."
