---
topic: scale-to-zero
requires: [data]
---

# Let a quiet app sleep

Header `X-Scale-To-Zero: true` on the deploy (JSON field `scaleToZero`). `false` turns it off. Without the header, apps stay on.

A server app with no real traffic for **6 hours** is stopped. The first real request wakes it: held, not refused, about 4 to 9 seconds. Status still reads `live` while asleep.

## Decide before you build

Good for an internal tool, a rarely used form, a webhook receiver. Not for a live dashboard where the first request must be instant.

## The app must

1. Keep lasting state under `DATA_DIR`. It survives the stop.
2. Tolerate restarting between requests. In-memory state is lost.

## Limits

- Crawlers and scanners don't wake it; they get a 404.
- Not for static sites (nothing to stop). WebSockets don't work either way.
- An app that fails the checks is left running.

**Say:** "Your app sleeps when nobody uses it and wakes in a few seconds on the next visit."
