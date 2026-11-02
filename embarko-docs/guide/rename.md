---
topic: rename
requires: [deploy, claim]
---

# Rename (display name)

`PATCH https://ship.embarko.ai/api/apps/<app-name>` · token always · harmless

Changes the name shown in the dashboard and on Showcase. **The address does not change.** Keep using the original slug in every call.

```bash
curl -sS -X PATCH 'https://ship.embarko.ai/api/apps/my-app' \
  -H "Authorization: Bearer $DEPLOY_TOKEN" -H 'Content-Type: application/json' -d '{"name":"My App"}'
```

Reply `{ "id", "name", "slug" }`.

Wants a different link? That is [change-address](change-address.md), a different and destructive call. Say which one you're doing.

**Say:** "Renamed to `<name>`. The link is the same."
