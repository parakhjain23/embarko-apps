---
title: No connectivity
---

# No connectivity

What to do when requests to `ship.embarko.ai` never get an HTTP reply at all: DNS failure, connection refused, timeout, or your sandbox's own 403 such as `host_not_allowed`.

**Call:** none. Nothing reached Embarko. There is no status to poll.

## Steps

1. Confirm it is a connection failure, not an HTTP error. Any HTTP status, even 404, means the network path works.

```bash
curl -sS --connect-timeout 5 -o /dev/null -w '%{http_code}\n' https://ship.embarko.ai/apps
```

2. Stop retrying. Two failures of the same shape mean a sandbox allowlist, not a flaky network.
3. If an Embarko connector is in your tools, use it. Its calls leave from the connector's servers.
4. Say it plainly: your environment cannot reach Embarko. Do not say the deploy failed.
5. Offer the lasting fix: connect Embarko to their AI tool (Claude: `https://claude.ai/directory/embarko`, all tools: `https://embarko.ai/docs/connectors`), or allow `embarko.ai`, `ship.embarko.ai` and `*.embarko.app` in the tool's network settings. In Claude that is Organization settings, Capabilities, domain allowlist, and applies to new conversations only.
6. Leave them a script for their own machine:

```bash
tar -czf /tmp/app.tar.gz --exclude=node_modules --exclude=.git --exclude='.env*' -C /path/to/app .
curl -sS -X POST https://ship.embarko.ai/apps -H "X-App-Name: my-app" -H "X-Agent-Name: human" -F "source=@/tmp/app.tar.gz"
curl -sS https://ship.embarko.ai/apps/my-app/status
```

## Limits

- Do not fall back to an anonymous deploy because a token deploy was blocked. Same host, same block.

## Errors

None from Embarko. The error is yours.

Say: "My environment can't reach Embarko, so nothing was deployed. Connect Embarko to your AI tool once and I can deploy from here on, or run the script I've given you on your own machine."
