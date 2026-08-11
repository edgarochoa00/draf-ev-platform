<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## ESPN Service Patterns (draf project)

When fetching from ESPN scoreboard APIs:
- Always use multi-fallback name extraction: `displayName → shortDisplayName → name → abbreviation`
- Validate that both home AND away team names are non-empty before emitting an event — skip events that can't be parsed
- Support competitors where ESPN omits `homeAway` by falling back to position order in the array
- Log skipped events with `print(f"Skipping event — could not parse teams")` for debugging

## Parlay Ticket UX Patterns (draf project)

When building pick/bet selection UIs:
- Market selection modals must NOT close when adding a pick — show a green checkmark "Añadido" feedback (2s timeout) per pick instead
- Use compound keys `event_id__selection_id` so multiple picks from the same match can coexist in the ticket
- The ticket panel must display picks grouped by match name with league label
- Show combined odds + combined EV + Kelly stake in a persistent live strip at the top of the ticket panel
- Always provide fallback local EV calculation if the backend is unreachable
- addToTicket() must return boolean (true=added, false=duplicate) so modals can react accordingly
