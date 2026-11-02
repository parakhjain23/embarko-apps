---
title: Showcase
requires: [claim]
---

# Showcase

Lists the app on Embarko Showcase, a public gallery of apps built with AI agents, or on an event's page.

**Call:** `PUT https://ship.embarko.ai/api/apps/<app-name>/showcase`. Auth: `Authorization: Bearer <deploy token>`.

## Steps

1. Only when the person wants it. Check for an existing listing, no auth: `GET https://ship.embarko.ai/api/public/showcase/apps/<app-name>`. 200 means listed, send only changes. 404 means new.
2. Draft the listing from the code: `tagline`, `description`, `story`, `category`, `tags`, `builtWith`. Write real, searchable text about what it does and who it is for.
3. Ask the person once, in one message, only for what you cannot know: `creatorName` (required first time), `creatorProfile`, `contributorEmails` (opt-in, first one is the main contact), `screenshotUrls`, `videoUrl`, `customHtml`, and for an event its `collectionSlug` and `code`. Skipped fields stay out. Never invent them.
4. Show the draft. On their yes, send it:

```bash
curl -sS -X PUT "https://ship.embarko.ai/api/apps/my-app/showcase" \
  -H "Authorization: Bearer $DEPLOY_TOKEN" -H "Content-Type: application/json" \
  -d '{ "tagline": "Track habits in one tap", "creatorName": "Asha", "description": "...", "story": "...",
        "category": "Productivity", "tags": ["habits", "tracker"], "builtWith": "Claude",
        "screenshotUrls": ["https://.../shot.png"] }'
```

Add `"collectionSlug": "<event>"` for an event page and `"code": "<submit code>"` to skip organiser approval.

Reply: HTTP 201 new or 200 updated, with the listing plus `status` and `next`:

- `approved`: live. Give the person `https://embarko.ai/showcase/app/my-app`. Then help them promote it as `next` says.
- `pending`: the organiser must approve. Resend with `code` to skip.
- `rejected`: `next` has the reason. Fix and resend.

## Limits

- Fields: `tagline` 160 chars, `description` 4000, `story` 600, `creatorName` 80, `tags` up to 8, `screenshotUrls` up to 10, `contributorEmails` up to 10, `customHtml` 50,000 chars with no scripts, styles, forms or iframes.
- `builtWith` is one of Claude, Codex, Cursor, Lovable, Replit, Other.
- `category` is one of AI Tool, Personal, Business, Productivity, Education, Game, Developer Tool, Other.
- A merge: only sent fields change. `""` clears a field, `[]` clears a list. Safe to resend.
- `name` here changes the display name only.

## Errors

| code | HTTP | Retry | Do |
| --- | --- | --- | --- |
| `validation_failed` | 400 | no | `details` names the field. |
| `SHOWCASE_COLLECTION_UNKNOWN` | 404 | no | Wrong event slug. Ask the person. |
| `unauthorized` | 401 | no | Token missing or invalid. |
| `app_not_found`, `app_renamed` | 404 | no | Claim first, or follow `retryUrl`. |

Say: "Your app is on Showcase: https://embarko.ai/showcase/app/my-app."
