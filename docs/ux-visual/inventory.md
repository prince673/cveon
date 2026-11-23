# UX Visual Inventory — CVEon

Hash-routed SPA (React 19 + Vite + Tailwind), dark "Night Ops HUD" theme with optional light theme.
No auth, no backend of our own — data comes live from NVD / CISA KEV / EPSS / GitHub (network required).
Dev URL: http://localhost:5173

## Routes & states

| Route | Reach | States |
|---|---|---|
| `#/` (home) | default | first-visit disclaimer modal → dismissed; empty search; recents/pins panels (in-memory, empty on fresh load); LatestIntel strip (loading skeleton / populated / error); hero + input form (valid ✓ / invalid ✗) |
| `#/cve/:id` (results) | submit search / click ticker row / pin | loading skeleton; populated (risk gauge card, timeline, vector chips, exploitability, guide, MD/JSON/Share/Print buttons); 404 not-found; 429 rate-limit; network error + Retry |
| `#/batch` | nav or `b` | empty (textarea + CSV import); populated table (distribution bar, mini rings, sort, filter, CSV export); partial errors block |
| `#/compare` | nav or `c` | empty (2–3 inputs); populated (verdict banner, gauges, delta rows); validation error |
| `#/kev` | nav or `k` | loading; populated paginated feed (filter, pagination); fetch error |

## Overlays / transient

- CommandPalette (`Ctrl/Cmd+K`) — modal, focus trap
- DisclaimerModal — first visit per session, focus trap
- ThreatTicker hover dropdown (newest KEV entries)
- "+N new" flash chips (ticker + LatestIntel)
- Toast-less; errors inline

## Layouts

- Single layout: sticky header (logo, ticker, nav, theme toggle) + centered content column (max-w ~1200) + aurora bg scene. Two-column results layout on `#/cve` (main + sticky right rail) at md+.
- Footer: privacy note.

## Component groups

- Header: logo wordmark, ThreatTicker, BranchedMenu nav, ThemeToggle
- Forms: InputForm (recents dropdown), BatchView textarea+CSV, CompareView slots
- Cards: VulnerabilityCard, RiskScoreCard, ExploitabilityCard, ExploitationGuide, LatestIntel cards, panels
- Table: BatchView rows (mini ring, priority pill), CompareView grid
- Feedback: SkeletonResults, inline errors, "+N new" chips

## Design tokens

- Tailwind config: keyframes fade-up, drift, pulseDot, sweep, glowBreathe, viewIn; `animate-*` utilities
- index.css: `.card`, `.card-flat`, `.glass`, `.btn-primary`, `.btn-ghost`, `.input-field`, `.section-label`, `.meter-fill`, `.inset-panel`, `.skeleton`, `.text-gradient`; light theme via `html.theme-light` overrides; reduced-motion + print blocks
- Accent #58a6ff, gradient #1f6feb→#bc8cff, severity palette red/orange/yellow/green

## Enforcement

No design-system check script; Tailwind + shared CSS classes are the system. Fixes land in index.css classes / tailwind config first.
