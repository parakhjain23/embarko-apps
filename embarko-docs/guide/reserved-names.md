---
topic: reserved-names
requires: []
---

# Reserved app names

These names are never free (`409 app_name_reserved`). Pick another; adding a word usually works (`docs` → `my-docs`).

ship, edge, api, app, apps, www, admin, dashboard, console, test, demo, staging, stage, dev, prod, production, preview, sandbox, beta, alpha, internal, local, localhost, mail, smtp, imap, pop, pop3, mx, webmail, email, ns, ns1, ns2, ns3, ns4, dns, autodiscover, autoconfig, spf, dkim, dmarc, acme, acme-challenge, well-known, wellknown, cert, certs, ca, login, signin, sign-in, signup, sign-up, register, logout, auth, oauth, sso, account, accounts, token, tokens, billing, pay, payment, payments, checkout, stripe, invoice, invoices, embarko, support, help, docs, doc, documentation, status, security, abuse, legal, terms, privacy, dpa, contact, sales, about, careers, jobs, blog, news, press, showcase, pricing, cdn, assets, static, media, files, uploads, storage, s3, db, database, redis, cache, queue, logs, metrics, grafana, prometheus, nomad, traefik, consul, vault, webhook, webhooks, callback, callbacks, proxy, gateway, registry, git, ci, build, deploy, deployments, skills, llms, mcp

Source of truth: the live API. If a name is refused with `app_name_reserved`, it's reserved whatever this list says.
