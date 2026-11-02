---
title: Update
requires: [deploy]
---

# Update

Ships a new version of an existing app. It is a [deploy](deploy) with the same name.

**Call:** `POST https://ship.embarko.ai/apps` with the same `X-App-Name`. Send the token if the app is claimed.

## Steps

1. Find the name. It is the subdomain of the live URL: `https://my-app.embarko.app` means `my-app`.
2. Package and deploy exactly as in [quickstart](quickstart), with a new `X-App-Version`.
3. Poll [status](status) until `live`.
4. Fetch the URL. Confirm the change is there. Report.
5. If the new version is broken and the old one was fine, [rollback](rollback) first, then fix.

## Limits

- Env vars, custom domains and `DATA_DIR` data are kept across updates.
- A temporary deploy cannot update a claimed app: 401 `unauthorized` without the owning token, 409 `app_name_taken` with the wrong company's token.
- A server app may be replaced by a static site. The reverse is 422 `app_kind_changed`.
- Only the last 5 builds are kept for rollback.

## Errors

Same as [deploy](deploy).

Say: "The new version is live: <url>."
