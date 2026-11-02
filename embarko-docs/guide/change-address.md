---
topic: change-address
requires: [deploy, claim]
---

# Change the web address

`POST https://ship.embarko.ai/api/apps/<app-name>/slug-change` · token always · async · **ask first, every time**

Moves the app to a new `<name>.embarko.app`. The old address stops working the moment the new one is live. No redirect. Someone else can claim the freed name. A custom domain keeps working. A Showcase listing follows.

A name that looks untidy to you is not a reason. The person asking is.

## Steps

1. Confirm: "Your app will move to `<new>.embarko.app` and the old link will stop working. Shared links break. Go ahead?"
2. Tell them a live app is offline for a few minutes while it moves and keeps its data.
3. Send:

   ```bash
   curl -sS -X POST 'https://ship.embarko.ai/api/apps/my-app/slug-change' \
     -H "Authorization: Bearer $DEPLOY_TOKEN" -H 'Content-Type: application/json' \
     -d '{"newName":"my-better-app"}'
   ```

4. Live app: `202` with `statusUrl` (`GET https://ship.embarko.ai/api/slug-changes/<project-id>`). Poll until `terminal`. `state` ends `succeeded` or `failed`; a failure leaves the app where it was. Never deployed: `200`, done at once.
5. Use `deployWith["X-App-Name"]` from now on. The old name answers `404 app_renamed` with `newName` and `retryUrl`: follow it. **Never redeploy under the old name**: that creates a second, empty app.

## Limits

One change per app per week (`429 slug_change_cooldown`, `retryAfterMs`).

## Errors

| Code | Status | Do |
|---|---|---|
| `invalid_app_name`, `app_name_too_short/_long` | 400 | name rules |
| `app_name_taken`, `app_name_reserved` | 409 | pick another |
| `deploy_in_progress`, `rename_in_progress` | 409 | wait |
| `no_current_deployment` | 409 | deploy once, retry |
| `slug_change_cooldown` | 429 | wait `retryAfterMs` |
| `app_state_unknown` | 503 | try again shortly |
| `rename_failed` | 502 | nothing changed; try once more |
| `rename_desynced` | 500 | report it; needs the Embarko team |

**Say:** done → "Done: your app is now at `<link>`. The old link no longer works."
