---
topic: showcase
requires: [deploy, claim]
---

# List it on Showcase

`PUT https://ship.embarko.ai/api/apps/<app-name>/showcase` · token · app must be claimed · idempotent, merges

https://embarko.ai/showcase is a public gallery of AI-built apps. One listing per app, reused on the public gallery and on event pages (hackathons, demo days). Pages are indexed by search engines. **Only when the person wants it listed.**

## Steps

1. Existing listing? `GET https://ship.embarko.ai/api/public/showcase/apps/<app-name>` (no token). 404 means none. Otherwise reuse it and send only changes.
2. Draft from the app itself: name, tagline, description, category, tags, the AI that built it. Write for people searching.
3. Ask once for what only the person knows: their name, a profile link, other contributors, screenshots or a video, and the event page and code if it's for an event. Never invent these.
4. Show the draft. On their yes:

   ```bash
   curl -sS -X PUT 'https://ship.embarko.ai/api/apps/my-app/showcase' \
     -H "Authorization: Bearer $DEPLOY_TOKEN" -H 'Content-Type: application/json' \
     -d '{"name":"My App","tagline":"One line about it","creatorName":"Jane","description":"What it does",
          "builtWith":"Claude","category":"AI Tool","tags":["chat","notes"],
          "screenshotUrls":["https://example.com/1.png"]}'
   ```

   Event page: add `"collectionSlug":"<event>"` and, if given, `"code":"<submit code>"`.
5. `approved`: give them `https://embarko.ai/showcase/app/<app-name>`. `pending`: the organiser must approve. Then follow `next`: it asks you to help them promote the app, and to suggest a short demo video if there is none.

## Fields

| Field | Note |
|---|---|
| `tagline` | required first time. One line, 60 to 160 chars. The page's search description |
| `creatorName` | required first time |
| `name` | page title. **Also renames the app in the dashboard** |
| `description` | up to 4,000 chars |
| `story` | why it was built, up to 600 |
| `creatorProfile` | an `https` link |
| `contributorEmails` | up to 10, the person first. Adds a "Contact Dev" button, addresses hidden. **Ask before sending** |
| `builtWith` | Claude, Codex, Cursor, Lovable, Replit, or another |
| `category` | AI Tool, Personal, Business, Productivity, Education, Game, Developer Tool, Other |
| `tags` | up to 8 |
| `screenshotUrls` | up to 10 `https` images. First is the card image. **No screenshot: the app is left off the public page** |
| `videoUrl` | a demo video. Qualifying approved videos earn a year of Embarko Pro |
| `customHtml` | extra page content, up to 50,000 chars. Scripts don't run |
| `prd` | the app's spec, for "Build similar app" |
| `collectionSlug`, `code` | event slug and submit code. Leave out for the gallery |

## Rules

- A repeat call merges. `""` clears a field, `[]` clears a list. `201` first time, `200` after.
- Gallery: live at once. Event without code: `pending`. Right code on first submission: `approved`. Wrong code: not an error, just `pending`. `rejected`: reason in `next`; fix and call again.
- A listing follows a change of address.

## Errors

| Code | Status | Do |
|---|---|---|
| `SHOWCASE_COLLECTION_UNKNOWN` | 404 | wrong event slug |
| `SHOWCASE_COLLECTION_PRIVATE` | 403 | another company's event |
| `validation_failed` | 400 | a field over its limit |
| `unauthorized` | 401 | bad token, or not claimed |

**Say:** confirm → "Here's how your app will look on Showcase: `<draft>`. Publish it?" · done → "Your app is on Showcase: `<link>`."
