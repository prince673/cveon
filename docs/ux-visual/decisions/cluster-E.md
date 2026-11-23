# Cluster E — disabled Proceed reads active
**A Minimal:** add `disabled:` variants to .btn-primary in index.css (desaturate + cursor-not-allowed + reduced shadow).
**B Restructure:** swap to ghost style when disabled. Inconsistent with enabled→enabled transition.
**C Convention:** keep color, add "check the box first" helper text. Adds copy; still ambiguous.
**Winner: A** — one CSS rule fixes every disabled primary button app-wide (batch/compare submit too).
**Test plan:** computed style check + screenshot.
