---
topic: update
requires: [deploy]
---

# Update an app

There is no update call. **Deploy again with the same name.** The first deploy of a name creates the app; every later one replaces it in place.

## Steps

1. Use the exact name. If you don't know it, it is the subdomain of the live link: `https://**my-app**.embarko.app`. Never invent `my-app-v2`: that is a second app on a second address, and the person's data stays on the first.
2. Deploy as in [deploy](deploy.md), same `X-App-Name`, new `X-App-Version`. If the app is claimed, send the token. An anonymous deploy can't update a claimed app.
3. Poll until `live`. Open the link. Tell the person.
4. If the new version built but the app is now broken, [rollback](rollback.md) first, then fix.

## What stays

Env vars, custom domain, `DATA_DIR` data, Showcase listing. Don't resend them.

## What resets

Everything outside `DATA_DIR`. A redeploy starts a fresh container.

**Say:** "Your app is updated: `<link>`."
