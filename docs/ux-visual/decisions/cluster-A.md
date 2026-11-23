# Cluster A — Signal Breakdown overflow
**A Minimal:** `w-full` on the signal block so it always wraps below the gauge. ✔ root fix in shared component, 1 line.
**B Restructure:** move Signal breakdown to its own card below. More churn, splits a coherent unit.
**C Convention:** responsive two-column only when rail ≥ 420px (container query). Overkill — rail is fixed ~340px.
**Winner: A.** The rail is always narrow; side-by-side never fits. Scores: usability A9/B7/C8, craft A8/B7/C8, engineering A10/B6/C5.
**Test plan:** DOM measure — no element right edge > card content right edge; labels not truncated.
