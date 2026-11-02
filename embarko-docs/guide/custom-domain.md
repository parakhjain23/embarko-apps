---
topic: custom-domain
requires: [deploy, claim]
---

# Own domain

`https://ship.embarko.ai/api/apps/<app-name>/domains` · token always · app must be claimed · paid plans only

If their plan doesn't include it, say so. Upgrading costs money: their decision, not yours.

The default `<app-name>.embarko.app` keeps working. HTTPS is automatic once DNS is in place. **The one step you can't do is creating the DNS record.** It lives where the person's domain is managed.

## Steps

1. Advise a subdomain (`app.theirdomain.com`, gets a `CNAME`) over an apex (`theirdomain.com`, gets an `A` record and loses any CDN in front).
2. Register:

   ```bash
   curl -sS -X POST 'https://ship.embarko.ai/api/apps/my-app/domains' \
     -H "Authorization: Bearer $DEPLOY_TOKEN" -H 'Content-Type: application/json' \
     -d '{"domain":"app.example.com"}'
   ```

   Reply `201` with `instructions`: the exact record. Nothing is live yet.
3. Give the person that one record in plain words: type, name, value, and where ("your domain provider's DNS settings"). On Cloudflare: **DNS-only (grey cloud)**. A proxied record never verifies.
4. When they say done, verify. Safe to repeat every few minutes; don't ask them if they're done:

   ```bash
   curl -sS -X POST 'https://ship.embarko.ai/api/apps/my-app/domains/app.example.com/verify' \
     -H "Authorization: Bearer $DEPLOY_TOKEN"
   ```

5. `status: "active"`: tell them.

## If it never verifies

The record is proxied, doesn't match exactly, or port 80 is blocked or redirected for that hostname (the certificate uses an HTTP-01 challenge).

## Other calls

`GET /domains` lists. `DELETE /domains/<domain>` removes (default URL unaffected). Works for static sites too. One domain belongs to one app. Domains carry over when the address changes.

## Errors

| Code | Status | Do |
|---|---|---|
| `invalid_domain` | 400 | not a hostname |
| `domain_reserved` | 400 | `*.embarko.app` can't be registered |
| `domain_taken` | 409 | another app has it |
| `domain_not_found` | 404 | not registered on this app |
| verify, `status: "failed"` | 422 | DNS not pointing yet. Wait, verify again |
| verify, `status: "pending_dns"` | 502 | DNS right, activation failed. Retry |

**Say:** ask → "To use `<domain>`, add this one record in your domain provider's DNS settings: `<type> <name> → <value>`. Tell me when it's done." · done → "`<domain>` now opens your app."
