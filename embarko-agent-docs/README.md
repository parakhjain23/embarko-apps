# embarko-agent-docs

Documentation that AI agents read to deploy and operate apps on Embarko for a person. Humans can read it too, but the agent is the audience.

```bash
node server.js          # http://localhost:4600
node test.js            # one self-check
```

| URL | What |
| --- | --- |
| `/` or `/llms.txt` | Contents page |
| `/<topic>` | Markdown for agents, HTML for browsers (by Accept and User-Agent) |
| `/<topic>.md`, `/<topic>.json`, `/<topic>.html` | Forced format |
| `/llms-full.txt` | Everything, in reading order |

Source is `docs/*.md`. The server generates the "Before this / Route priority / Reply to the person" block on every topic from each page's `requires:` line. Read `DESIGN.md` before editing.

Facts come from the code, not from older docs: `hostnsoft-deploy/capabilities.js`, `deploy-response.js`, `server.js`, `json-source.js`, and `hostnsoft-api/src/routes/agentApps.routes.ts`.
