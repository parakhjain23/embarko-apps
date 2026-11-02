---
title: Delete
requires: [claim]
---

# Delete

Removes the app, its URL and all its data. Cannot be undone. There is no backup.

**Call:** `DELETE https://ship.embarko.ai/api/apps/<app-name>`. Auth: `Authorization: Bearer <deploy token>`.

## Steps

1. Only when the person explicitly asked. Never as cleanup you decided on.
2. Tell them what goes: the running app, `https://<name>.embarko.app`, everything under `DATA_DIR`. Get a clear yes.
3. Delete, repeating the name as confirmation:

```bash
curl -sS -X DELETE "https://ship.embarko.ai/api/apps/my-app" \
  -H "Authorization: Bearer $DEPLOY_TOKEN" -H "Content-Type: application/json" \
  -d '{"confirmAppName": "my-app"}'
```

Reply: HTTP 204, empty body.

4. Tell them the name is free for anyone to take now.

## Limits

- Needs the owning token. A temporary app cannot be deleted this way; it expires on its own after 24 hours.

## Errors

| code | HTTP | Retry | Do |
| --- | --- | --- | --- |
| `confirmation_required` | 400 | no | `confirmAppName` missing or wrong. Nothing deleted. |
| `unauthorized` | 401 | no | Token missing or invalid. |
| `app_not_found`, `app_renamed` | 404 | no | Wrong name, or follow `retryUrl`. |

Say: "This deletes the app, its address and all its data for good. There's no backup. Shall I go ahead?"
