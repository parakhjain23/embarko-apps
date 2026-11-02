---
topic: rollback
requires: [deploy, claim]
---

# Undo a bad update

`POST https://ship.embarko.ai/api/apps/<app-name>/rollback` · token always · async

Switch the app back to an earlier successful build. No rebuild, seconds. Keeps today's env vars and domains. **Code only: `DATA_DIR` is untouched.**

## Steps

1. Optional: list history. `rollbackTarget: true` marks valid targets. Pick the newest good one **before** the bad deploy, not just the previous entry.

   ```bash
   curl -sS 'https://ship.embarko.ai/api/apps/my-app/deployments' -H "Authorization: Bearer $DEPLOY_TOKEN"
   ```

2. Roll back. `{}` means the previous good build:

   ```bash
   curl -sS -X POST 'https://ship.embarko.ai/api/apps/my-app/rollback' \
     -H "Authorization: Bearer $DEPLOY_TOKEN" -H 'X-Agent-Name: codex' \
     -H 'Content-Type: application/json' -d '{"deploymentId":"<id>"}'
   ```

3. Reply `202` with `statusUrl`. Poll it until `terminal` is true. Not instant.
4. Open the link. Tell the person what you put back and why. Then fix forward.

## Limits

- Only the last 5 builds are kept. Older: `rollback_image_unavailable`, `retainCount` says how far back you can go. Redeploy the old source from git instead.
- A rollback adds a new history entry. History is never rewritten.

## Errors

| Code | Status | Do |
|---|---|---|
| `no_rollback_target` | 422 | no earlier good deploy. Fix forward |
| `rollback_image_unavailable` | 422 | pick a newer target |
| `rollback_not_successful_deployment` | 422 | pick another |
| `no_current_deployment` | 422 | deploy once first |
| `rename_in_progress` | 409 | wait |
| `rollback_push_failed` | 502 | retry once |
| `unauthorized` | 401 | bad token |

**Say:** "I put the previous version back, so your app works again. I'll fix the new version next."
