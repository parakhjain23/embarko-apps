---
title: Domains
requires: [claim]
---

# Domains

Points a domain the person owns at the app. You do every step except creating the DNS record.

**Call:** `https://ship.embarko.ai/api/apps/<app-name>/domains`. Auth: `Authorization: Bearer <deploy token>`.

## Steps

1. Prefer a subdomain (`app.example.com`) over a root domain. A root domain gets an A record straight to the origin and loses any CDN in front.
2. Register:

```bash
curl -sS -X POST "https://ship.embarko.ai/api/apps/my-app/domains" \
  -H "Authorization: Bearer $DEPLOY_TOKEN" -H "Content-Type: application/json" \
  -d '{"domain": "app.example.com"}'
```

Reply, HTTP 201:

```json
{ "domain": "app.example.com", "status": "pending_dns",
  "instructions": { "type": "CNAME", "name": "app.example.com", "value": "<edge hostname>" } }
```

A root domain gets `"type": "A"` with an IP.

3. Give the person exactly that record: type, name, value. On Cloudflare it must be DNS only (grey cloud), not proxied.
4. Verify, and keep verifying every few minutes:

```bash
curl -sS -X POST "https://ship.embarko.ai/api/apps/my-app/domains/app.example.com/verify" \
  -H "Authorization: Bearer $DEPLOY_TOKEN"
```

Reply when done: `{ "domain": "app.example.com", "status": "active" }`. HTTPS is set up automatically.

5. Fetch `https://app.example.com`, then report. The `.embarko.app` URL keeps working.

List: `GET .../domains` returns `{ "domains": [...] }`. Remove: `DELETE .../domains/<domain>` returns 204.

## Limits

- Works for server apps and static sites.
- One domain belongs to one app.
- Port 80 must reach Embarko for the certificate challenge.

## Errors

| code | HTTP | Retry | Do |
| --- | --- | --- | --- |
| `invalid_domain` | 400 | no | Not a valid domain name. |
| `domain_reserved` | 400 | no | Embarko's own zones cannot be registered. |
| `domain_taken` | 409 | no | Already on another app. |
| `domain_not_found` | 404 | no | Register first. |
| (none, `status: "failed"`) | 422 | later | DNS not pointing here yet. `instructions` repeats the record. Retry in a few minutes. |
| (none, `status: "pending_dns"`) | 502 | once | DNS fine, routing push failed. |

Say: "Add this DNS record with your domain provider: CNAME app.example.com to <value>. Tell me when it's done and I'll finish."
