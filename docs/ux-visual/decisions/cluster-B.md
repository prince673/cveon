# Cluster B — LatestIntel error card dead space
**A Minimal:** compact error state: icon + one line + Retry button, natural height.
**B Restructure:** collapse the whole card to a single row when feed fails.
**C Convention:** skeleton stays, error replaces list inside fixed height. Keeps dead space — rejected.
**Winner: A** (+ keep populated/skeleton states unchanged). usability A9/B8, craft A8/B7, engineering A9/B7.
**Test plan:** error card height < 140px; Retry button visible and ≥24px target.
