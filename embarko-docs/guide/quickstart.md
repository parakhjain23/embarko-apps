---
topic: quickstart
requires: [prerequisites]
---

# Deploy to Embarko

Six steps. Do them in order. Open a linked topic only when a step goes wrong.

## 1. Deploy

**Connector in your tools?** Use it. Poll until `live`. The app is already permanent: skip step 2.

**Can run commands?** The skill does this whole step: `npx skills add embarko-ai/skill --skill embarko-deploy -g`, then `./scripts/deploy.sh /path/to/app`. It prints `==> Live:` and `==> Next:`.

**Otherwise, raw API:**

```bash
tar -czf /tmp/app.tar.gz --exclude=node_modules --exclude=.git --exclude='.env*' -C /path/to/app .
curl -sS -X POST 'https://ship.embarko.ai/apps' \
  -H 'X-App-Name: my-app' -H 'X-Agent-Name: <your-name>' -F 'source=@/tmp/app.tar.gz'
```

Before you package: the app reads `PORT`, binds `0.0.0.0`, has no Dockerfile, writes lasting data under `DATA_DIR`, and its manifest or `index.html` is at the top of the folder. Name: lowercase, digits, dashes, 3 to 63 chars. "My Landing Page" → `my-landing-page`.

Already have a token (`$DEPLOY_TOKEN` or `~/.embarko/credentials`)? Add `-H "Authorization: Bearer $DEPLOY_TOKEN"` and skip step 2.

Poll every 10 seconds until `status` is `live` (a static site is usually `live` in the deploy reply itself):

```bash
curl -sS 'https://ship.embarko.ai/apps/my-app/status'
```

Open `https://my-app.embarko.app` yourself. Then give the person the link and, if there was no token, the deletion time (`app.expiresAt`).

**`failed` or `crashed`:** read `links.logs`. Most causes: not reading `PORT` or binding `localhost`, a Dockerfile, the manifest in a subfolder, a dev server as the start command, WebSockets or cron. Fix, deploy again, same name. [logs](logs.md)

**No reply at all, or your sandbox blocks it:** nothing was deployed. Stop retrying. [no-connectivity](no-connectivity.md)

More: [deploy](deploy.md) · [static-sites](static-sites.md) · [data](data.md)

## 2. Keep it

Skip if you deployed through the connector or with a token. Otherwise the app is deleted 24 hours after the first deploy.

1. Ask for their email. Send it once:

   ```bash
   curl -sS -X POST 'https://ship.embarko.ai/api/public/deploy-tokens/request' \
     -H 'Content-Type: application/json' -d '{"email":"<their email>"}'
   ```

2. Ask them to paste the token from their inbox. Save it to `~/.embarko/credentials` (mode 600). Never repeat it back.
3. Run step 1 again, same name, with `-H "Authorization: Bearer <token>"`. The reply says `claimed: true`.
4. From now on send the token on every call, including status. A claimed app answers 404 without it.

More: [claim](claim.md)

## 3. Update it

The person wants a change shipped? **Deploy again with the same name.** Never a new name: that makes a second app on a second address. Env vars, domain and data stay. [update](update.md)

## 4. Manage

Only when the person asks. All need the token (or the connector).

| The person wants | Read |
|---|---|
| Is it up? | [status](status.md) |
| Why did it break? | [logs](logs.md) · [app-broken](app-broken.md) |
| Add an API key or secret | [env-vars](env-vars.md) |
| Use my own domain | [custom-domain](custom-domain.md) |
| Undo the last update | [rollback](rollback.md) |
| How many visitors? | [analytics](analytics.md) |
| A nicer name | [rename](rename.md) |
| A different address | [change-address](change-address.md) (ask first) |
| Delete it | [delete](delete.md) (ask first) |
| It's rarely used | [scale-to-zero](scale-to-zero.md) |

## 5. Showcase

Only if the person wants it public. The app must be claimed. Draft the listing, show it, publish on their yes. [showcase](showcase.md)

## 6. Stuck, or something missing?

If Embarko itself is wrong, a feature is missing, or this guide is unclear, report it:

```bash
curl -sS -X POST 'https://ship.embarko.ai/apps/my-app/customer-query' \
  -H 'X-Agent-Name: <your-name>' -H 'Content-Type: application/json' \
  -d '{"type":"platform_bug","message":"What went wrong, what you expected, the app name."}'
```

Types: `platform_bug` · `missing_capability` · `docs_issue` · `unexpected_behavior` · `other`. [feedback](feedback.md)
