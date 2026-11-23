# Cluster C — sub-24px targets
**A Minimal:** pad existing controls to ≥24px (chips py-1, footer links py-1.5, Remove-CVE w-7 h-7, NVD↗ px/py).
**B Restructure:** global min-hit-area utility class applied everywhere. Broader but riskier visual drift.
**C Convention:** invisible ::after hit expansion. Hard to verify.
**Winner: A** — visible padding, no visual drift at normal zoom.
**Test plan:** re-run layout-audit smallTargets on affected routes; expect only decorative links remaining.
