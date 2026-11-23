# UX Visual Report — run 1

## Coverage
Audited: all 5 routes (#/, #/cve/:id, #/batch, #/compare, #/kev) at 1440×900 with populated states
(real API data), plus DOM audits at 390×844 for every route. Disclaimer modal and LatestIntel error
state captured and reviewed.
Not audited: command palette, notification dropdown, print stylesheet, light theme screenshots
(light-theme token remaps were verified in code).

## Findings (before → after)
| Cluster | Sev | Problem | Fix | Verified |
|---|---|---|---|---|
| A | P1 | Signal Breakdown `%` labels spilled 46px past the RiskScoreCard edge; labels truncated | `w-full` signal block + wrap-not-truncate labels (root fix in shared component) | 0 overflow / 0 truncation (measured) |
| B | P1 | "NVD feed unavailable" rendered as a full-height dead panel (3% fill), no retry | Centered icon+message+Retry state; `retryFeeds()` reloads both feeds | Vision-confirmed intentional; Retry wired |
| C | P2 | 9–14 interactive targets < 24px (example chips, footer links, Remove-CVE 12×18, NVD↗) | Padding + negative-margin hit expansion; Remove-CVE → 28×28 with hover surface | 0 small targets on home/compare/batch |
| D | P2 | 10px meta text at 2.67:1 (timestamps, auto-refresh, v4.0, /100, counters) | `text-gray-600/#6e7681` → `gray-500/gray-400` app-wide; light-theme remaps intact | 0 items < 4.5:1 on home/compare/batch |
| E | P2 | Disabled "Proceed" read as active (saturated blue) | `.btn-primary` disabled: saturate(.35) + no glow + not-allowed | Computed style verified |

## Deferred
- **F (P3) Type-scale sprawl** — 8–9 distinct font sizes per screen (9–16px). Cross-cutting refactor;
  tracked in problems.md. No functional impact.

## Excellent as is
- Zero horizontal scroll at 390×844 on every route; zero element overlaps anywhere.
- Compare verdict banner hierarchy praised by vision pass ("clear focal point… restrained highlights").
- Batch risk-distribution bar proportionally accurate (3:2 P1:P2 rendered 60/40).
- KEV table rhythm and column alignment called out as steady and scannable.
- Nav contrast was a false positive — actual #58a6ff on #05070d ≈ 7:1.

## Regression status
`npm run lint` clean · 89/89 tests pass · production build succeeds.
