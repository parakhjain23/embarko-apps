# How this guide is designed

Rules we followed while writing docs for AI agents. Keep them when adding a topic.

## 1. One entry, one happy path, then topics

- `README.md` (served as `/` and `/llms.txt`) is the map. One line per topic. It says: "Deploying? Read only quickstart."
- `quickstart.md` is the whole job on one page: deploy → keep → update → manage → showcase → report.
- Everything else is one topic per task. An agent opens a topic only when a step goes wrong or the person asks for that thing.

## 2. Every page can be the first page

Agents land anywhere (a link from an API reply, a search). So every topic starts with the same generated block:

- **Before this:** what must already be true, with links, and one call to confirm it (`GET /apps/<name>/status` → `live`, `claimed: true`).
- **Route priority:** connector → MCP URL → skill → raw API.
- **Reply to the person:** 1 to 2 plain sentences. Link to the rules.

Pages don't write this by hand. They declare one line, `requires: [deploy, claim]`, and `server.js` builds the block. Change the wording once, every page changes.

## 3. Shortest page that still lets the agent act

Each topic has only: the call, the steps, limits, errors with retry, and what to say to the person. No history, no "why we built it". If cutting a line would make an agent guess or loop, keep the line.

## 4. One home per fact

A fact lives on one page. Other pages link to it. Example: the 24-hour rule lives in `claim`; `deploy` and `quickstart` say "temporary, see claim".

## 5. Facts come from the code, not from older docs

Every limit, code and header was checked against `hostnsoft-deploy` and `hostnsoft-api`. Limits that aren't enforced are left out, not guessed. If the guide and the live API disagree, the API wins, and the guide says so.

## 6. Every error has a code, a retry answer, and a fix

Tables, three columns. Agents branch on `code`, never on the error text.

## 7. Every page ends with what to say

The person is usually not a developer. Each topic gives the exact line: "Your app is live: `<link>`." No commands, tokens or logs unless asked.

## 8. Ask only in the listed cases

A secret, a DNS record, money, something that can't be undone, no connectivity, a real ambiguity. Everything else the agent decides. Listed once in `prerequisites`.

## 9. Three formats, one source

`/<topic>` (HTML for people, markdown for curl and agents), `/<topic>.md`, `/<topic>.json`, `/llms.txt`, `/llms-full.txt`. All generated from the same markdown file at request time. Nothing is copied.

## 10. Plain words

Say: live, open app, deploy, update, keep. Avoid: provision, runtime, container, endpoint. Numbers in plain units: "6 hours", not "360 minutes".

## Adding a topic

1. Create `guide/<topic>.md` with `requires: [...]` in the frontmatter.
2. Add one row to the README table. That sets its order in the sidebar and in `llms-full.txt`.
3. End with a **Say:** line.
4. Link it from `quickstart` if a person would ask for it.
