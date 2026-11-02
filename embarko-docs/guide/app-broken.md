---
topic: app-broken
requires: [deploy]
---

# Live but misbehaving

The deploy succeeded, so this is a runtime problem, not a build problem.

## Steps

1. **Is it running?** `GET .../status`. `crashed` means it stops on start; `live` means the process is up.
2. **Read stderr.** `GET .../logs?stream=stderr`. Look above any crash-loop line for the real cause. [logs](logs.md)
3. **OOM (`Exit Code: 137`)?** 256MB is fixed. Shrink: production start command, drop unused dependencies, stream instead of buffering.
4. **Data vanished?** It was written outside `DATA_DIR`. Move the path, redeploy. [data](data.md)
5. **Secret missing?** The app needs a key only the person has. Send them the secrets page. [env-vars](env-vars.md)
6. **Worked before the last deploy?** [rollback](rollback.md) first to restore service, then fix and redeploy.
7. **A feature silently does nothing?** WebSockets, cron and background work don't run here. Redesign ([prerequisites](prerequisites.md), "Does the app fit").
8. **Looks like Embarko, not the app?** [feedback](feedback.md).

## Not available

No uptime monitoring, no alerting, no notice when an app goes down. If that matters, point outside monitoring at the URL.

**Say:** "Found the problem and fixed it. Your app is back: `<link>`." or, if you rolled back, "I put the previous version back, so your app works again. I'll fix the new version next."
