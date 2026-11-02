---
title: Rename
requires: [claim]
---

# Rename

Changes the display name shown on the dashboard and Showcase. The URL does not change.

**Call:** `PATCH https://ship.embarko.ai/api/apps/<app-name>`. Auth: `Authorization: Bearer <deploy token>`.

## Steps

1. Tell the person the URL stays the same. If they want a new URL, read [address](address) instead.
2. Rename:

```bash
curl -sS -X PATCH "https://ship.embarko.ai/api/apps/my-app" \
  -H "Authorization: Bearer $DEPLOY_TOKEN" -H "Content-Type: application/json" \
  -d '{"name": "My App"}'
```

Reply, HTTP 200: `{ "id": "cm...", "name": "My App", "slug": "my-app" }`.

3. Keep using `my-app` in every other call.

## Limits

- Display name only. No length rule beyond being non-empty.

## Errors

| code | HTTP | Retry | Do |
| --- | --- | --- | --- |
| `validation_failed` | 400 | no | `name` must be a non-empty string. |
| `unauthorized` | 401 | no | Token missing or invalid. |
| `app_not_found`, `app_renamed` | 404 | no | Wrong name, or follow `retryUrl`. |

Say: "Done. It's now called My App. The address is unchanged."
