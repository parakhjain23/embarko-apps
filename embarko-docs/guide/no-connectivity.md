---
topic: no-connectivity
requires: []
---

# You can't reach Embarko

If a request never reaches `ship.embarko.ai` (connection refused, DNS failure, a proxy block, a `403 host_not_allowed` from your own sandbox, a hang), **nothing was deployed.** No status to check, no logs to read. This is not a failed deploy.

Cause: your environment has a domain allowlist without `ship.embarko.ai`. Common in hosted AI tools. Two failures of the same shape mean this, not a flaky network.

## Steps

1. **Stop retrying.** The same call fails the same way.
2. **Connector in your tools?** Use it. It runs outside your sandbox.
3. **Say so plainly.** "My environment can't reach Embarko, so nothing was deployed." Don't say the deploy failed; that sends them looking for a bug in their app.
4. **Offer the lasting fix.** Connect Embarko to their AI tool once: https://embarko.ai/docs/connectors (Claude: https://claude.ai/directory/embarko, ChatGPT plugin: https://chatgpt.com/plugins/embarko). Then ask again.
5. **Offer the allowlist fix.** Their tool's network settings: add `embarko.ai`, `ship.embarko.ai`, `*.embarko.app`. In Claude this is an organisation setting and applies to new conversations only.
6. **Leave something that works now.** A script for their own machine:

   ```bash
   tar -czf /tmp/app.tar.gz --exclude=node_modules --exclude=.git --exclude='.env*' -C /path/to/app .
   curl -sS -X POST 'https://ship.embarko.ai/apps' -H 'X-App-Name: my-app' -F 'source=@/tmp/app.tar.gz'
   curl -sS 'https://ship.embarko.ai/apps/my-app/status'   # poll until live
   ```

   Or hand them a `.zip` to upload at https://embarko.ai/app.

## Don't

Don't fall back to an anonymous deploy because the token call was blocked. Same host, same block. And it would hand them a temporary app they didn't ask for.
