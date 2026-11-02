---
topic: delete
requires: [deploy, claim]
---

# Delete an app

`DELETE https://ship.embarko.ai/api/apps/<app-name>` · token always · **ask first, naming the app**

Removes the running app, its link, its image and everything under `DATA_DIR`. No backup, no undo. The name is freed for anyone.

## Steps

1. Confirm by name: "This deletes `<app>` and all its data for good. Delete it?" Only on an explicit yes.
2. Send the name again as confirmation:

   ```bash
   curl -sS -X DELETE 'https://ship.embarko.ai/api/apps/my-app' \
     -H "Authorization: Bearer $DEPLOY_TOKEN" -H 'Content-Type: application/json' \
     -d '{"confirmAppName":"my-app"}'
   ```

3. `204` means deleted.

Wants only the old version back? That's [rollback](rollback.md).

## Errors

| Code | Status | Do |
|---|---|---|
| `confirmation_required` | 400 | `confirmAppName` missing or different. Nothing was deleted |
| `unauthorized` | 401 | bad token |
| `app_not_found` | 404 | unknown, or not yours |

**Say:** "`<app>` is deleted. The name is free again."
