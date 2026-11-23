# Problems — consolidated (run 1)

## Cluster A — Signal Breakdown overflows RiskScoreCard (P1)
- **Root cause:** `RiskScoreCard.jsx` puts the signal block (`flex-1 min-w-0`) inside a `flex flex-wrap` row next to the gauge. The card only ever renders in the ~340px right rail, so the block is squeezed to 162px while its rows need 244px min-content → `%` labels spill 46px past the card edge (measured: span right 1326 vs card right 1280) and signal labels truncate ("CVSS Critical (10.0/…").
- **Surfaces:** `#/cve/:id` right rail. Evidence: results audit + DOM measurement.
- **Acceptance:** no element extends past the card's right padding edge; signal labels not truncated at 1440×900 and 390×844.

## Cluster B — LatestIntel NVD error card is a full-height dead panel (P1)
- **Root cause:** error state renders inside the same min-height card shell as the populated list (466×323, fillPct 3 measured) — a big empty box with one line of text; no retry affordance.
- **Surfaces:** home "Newest disclosures" card. Evidence: layout-audit deadSpace + vision pass.
- **Acceptance:** error/empty state height ≈ its content; visible Retry action; populated card unaffected.

## Cluster C — Interactive targets below 24px (P2)
- **Root cause:** several controls sized to text only: recents chips 16px tall, footer resource links 17px, header "NVD↗" 16px, Compare "Remove CVE" 12×18, CWE chips 21px.
- **Surfaces:** home, results, compare, footer. Evidence: layout-audit smallTargets (all routes).
- **Acceptance:** every interactive element ≥ 24×24px hit area.

## Cluster D — Low-contrast 10px meta text (P2)
- **Root cause:** `text-gray-600` (#6e7681, 2.67:1) used for timestamps ("3d ago"), "auto-refresh 5 min", "v4.0", gauge "/100", Remove-CVE icons — below 4.5:1 for small text.
- **Surfaces:** header, LatestIntel, home recents, compare gauges, modal. Evidence: layout-audit lowContrast (real items only; 1.04 entries are gradient-text audit artifacts — verified actual color #58a6ff ≈ 7:1).
- **Acceptance:** all body/meta text ≥ 4.5:1 on dark bg (gray-500 minimum).

## Cluster E — Disabled "Proceed" reads as active (P2)
- **Root cause:** disabled state keeps saturated `btn-primary` blue; only the label dims. Vision pass flagged it as mistakable for active.
- **Surfaces:** DisclaimerModal. Evidence: 1440x900-modal.png look_at_image.
- **Acceptance:** disabled button visibly desaturated + `cursor-not-allowed`; enabled state unchanged.

## Deferred
- **F (P3) Type-scale sprawl:** 8–9 distinct font sizes per screen (9/10/11/12/13/14/15/16px). Real but a cross-cutting refactor; risky to batch with fixes. Track separately.

## Coverage
All 5 routes audited at 1440×900 (populated states for batch/compare/results, error state for home NVD card); DOM audits at 390×844 for all 5. Not audited: light theme (spot-checked manually during earlier work), command palette, notification dropdown, print stylesheet.
