---
title: Address
requires: [claim]
---

# Address

Changes the app's URL from `old.embarko.app` to `new.embarko.app`. The old address stops working with no redirect.

**Call:** `POST https://ship.embarko.ai/api/apps/<app-name>/slug-change`. Auth: `Authorization: Bearer <deploy token>`.

## Steps

1. Ask the person first, every time. Say: the old link dies, shared links break, someone else can take the old name, the app is offline for a few minutes. An untidy name is not a reason. Their request is.
2. Change it:

```bash
curl -sS -X POST "https://ship.embarko.ai/api/apps/my-app/slug-change" \
  -H "Authorization: Bearer $DEPLOY_TOKEN" -H "Content-Type: application/json" \
  -d '{"newName": "my-better-app"}'
```

Reply, HTTP 202:

```json
{ "projectId": "cm...", "name": "my-better-app", "appUrl": "https://my-better-app.embarko.app",
  "deployWith": { "X-App-Name": "my-better-app" }, "moving": true, "terminal": false,
  "from": "my-app", "to": "my-better-app", "statusUrl": "/api/slug-changes/cm...",
  "customDomainsUnaffected": [], "oldAddressStops": true }
```

HTTP 200 with `"moved": false` means the name was already this. HTTP 200 with `"moved": true, "terminal": true` means it was applied at once.

3. Poll `https://ship.embarko.ai` + `statusUrl` (with the token) until `state` is `succeeded` or `failed`. `currentSlug` always says where the app is. A failure leaves it on the old address.
4. Use `deployWith` for every later deploy. A later call with the old name answers 404 `app_renamed` with `newName` and `retryUrl`: follow it, never redeploy under the old name.
5. Fetch the new URL, then report. Custom domains carry over. A Showcase listing keeps its own URL.

## Limits

- One change per app per week.
- New name follows the same rules as any app name.

## Errors

| code | HTTP | Retry | Do |
| --- | --- | --- | --- |
| `invalid_app_name`, `app_name_too_short`, `app_name_too_long` | 400 | no | Fix the name. |
| `app_name_reserved`, `app_name_taken` | 409 | no | Pick another. |
| `deploy_in_progress`, `rename_in_progress` | 409 | later | Wait for it to finish. |
| `no_current_deployment` | 409 | no | Deploy once first. |
| `slug_change_cooldown` | 429 | later | `retryAfterMs` says when. |
| `app_state_unknown` | 503 | once | Then report. |
| `rename_failed` | 502 | once | App untouched on the old address. |

Say: "Your app's address is changing to https://my-better-app.embarko.app. The old link will stop working. It takes a few minutes."
