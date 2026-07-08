# Documentation debt (tracked, not hidden)

Status: Living
Version: 1.0
Last Updated: 2026-07-08

Surfaced by `ci/check-docs.sh`. These are known gaps, recorded so they are tasks rather than surprises. Fix opportunistically — do not batch-backfill as make-work (ADR-005).

| Item | Count | Notes |
|---|---|---|
| Sprint A docs missing metadata headers | 28 findings across ~9 files | Written before the header standard (documentation-architecture §header). Add headers when a Sprint A doc is next touched for a real reason. |

When CI is wired, either (a) fix a file's header the next time it changes, or (b) if you want green CI immediately, add headers to the Sprint A set as one deliberate housekeeping PR labeled as such.
