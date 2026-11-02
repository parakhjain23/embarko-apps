---
title: Quickstart
check: curl -s https://ship.embarko.ai/apps/<app-name>/status | grep -q '"status":"live"'
---

# Quickstart

Deploy an app to Embarko and report the URL. Everything on this page is enough. Open another page only when a step fails or the person asks for more.

## 0. Does the app fit?

- One web process, one language, reads `process.env.PORT`, binds `0.0.0.0`.
- No Dockerfile. No WebSockets, no cron, no background workers (see [not-supported](not-supported)).
- Anything that must last is written under `DATA_DIR` (see [data](data)).
- Memory is 256MB.
- The manifest (`package.json`, `requirements.txt`, `go.mod`, ...) or `index.html` is at the root of the folder you package. A repo whose root only delegates to `frontend/` means you package `frontend/`.

If it does not fit, tell the person before deploying.

## 1. Pick a name

Lowercase letters, digits, dashes. 3 to 63 characters. No leading or trailing dash. It becomes the public subdomain. Slugify prose: "My Landing Page" becomes `my-landing-page`. Do not ask the person.

## 2. Package

```bash
tar -czf /tmp/app.tar.gz --exclude=node_modules --exclude=.git --exclude='.env*' -C /path/to/app .
```

## 3. Deploy

```bash
curl -sS -X POST https://ship.embarko.ai/apps \
  -H "X-App-Name: my-app" \
  -H "X-App-Version: $(git rev-parse --short HEAD 2>/dev/null || date +%s)" \
  -H "X-Agent-Name: claude" \
  -F "source=@/tmp/app.tar.gz"
```

Add `-H "Authorization: Bearer $DEPLOY_TOKEN"` only if `$DEPLOY_TOKEN` or `~/.embarko/credentials` already exists. Never send an empty or invented token. Without a token the app is live but temporary.

Reply for a server app, HTTP 202:

```json
{
  "success": true,
  "status": "building",
  "app": { "name": "my-app", "kind": "service", "claimed": false, "expiresAt": "2026-10-10T09:12:00.000Z" },
  "next": "Building: poll links.status every 10 seconds until it says \"live\" or \"failed\".",
  "links": { "status": "https://ship.embarko.ai/apps/my-app/status", "feedback": "https://ship.embarko.ai/apps/my-app/customer-query" }
}
```

A plain static site answers HTTP 200 with `"status": "live"` already. Skip step 4.

202 is not live. Any non-2xx reply has `code`: look it up in [errors](errors).

## 4. Poll until live

```bash
curl -sS https://ship.embarko.ai/apps/my-app/status
```

Every 10 seconds (2 for static). Send the same `Authorization` header you deployed with. Stop at:

```json
{
  "status": "live",
  "app": { "name": "my-app", "kind": "service", "claimed": false, "expiresAt": "2026-10-10T09:12:00.000Z" },
  "next": "Live: give the user links.app and tell them it will be deleted at 2026-10-10T09:12:00.000Z unless claimed. To claim it, follow links.help.",
  "links": { "app": "https://my-app.embarko.app", "feedback": "https://ship.embarko.ai/apps/my-app/customer-query", "help": "https://ship.embarko.ai/capabilities/claim" }
}
```

`failed` or `crashed`: read [logs](logs), fix, redeploy with the same name. Still `building` after 10 minutes: read [status](status).

## 5. Verify, then report

```bash
curl -sS -o /dev/null -w '%{http_code}' https://my-app.embarko.app
```

Only after a 2xx or 3xx, tell the person. Follow `next` in every reply.

Say: "Your app is live: https://my-app.embarko.app. It will be deleted on <date> unless we keep it. Want me to make it permanent?"

## The person wants X, read Y

| The person wants | Read |
| --- | --- |
| To keep the app past 24 hours | [claim](claim) |
| A new version shipped | [update](update) |
| An API key or setting added | [env-vars](env-vars) |
| Their own domain | [domains](domains) |
| The old version back | [rollback](rollback) |
| A different display name | [rename](rename) |
| A different URL | [address](address) |
| The app deleted | [delete](delete) |
| Visitor numbers | [analytics](analytics) |
| The app listed publicly | [showcase](showcase) |
| To report a problem with Embarko | [feedback](feedback) |
| Nothing works, requests never leave your sandbox | [no-connectivity](no-connectivity) |
| How you should behave, when to ask them | [rules](rules) |
