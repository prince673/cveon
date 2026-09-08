"""Transparent risk-prioritization engine.

Combines CVSS (severity) + EPSS (exploitation likelihood, with trend) + KEV (confirmed
exploitation, with recency) + exploit availability + temporal maturity to produce a
P1–P4 priority with human-readable reasons.

Each signal contributes independently to the score and produces a written justification.
The engine supports custom weight overrides so consumers can tune the prioritization.
"""

from datetime import datetime, timedelta, timezone

DEFAULT_WEIGHTS = {
    "cvss": 25,
    "epss": 20,
    "kev": 25,
    "exploit": 15,
    "temporal": 15,
}

THRESHOLDS = [
    (80, "Critical", "P1"),
    (60, "High", "P2"),
    (35, "Medium", "P3"),
]

RECOMMENDATIONS = {
    "P1": "Remediate immediately. Patch affected systems or apply mitigating controls without delay.",
    "P2": "Remediate urgently. Schedule patching within the current security cycle.",
    "P3": "Remediate in standard cycle. Include in next regular patch window.",
    "P4": "Monitor. Track for changes in exploitation status or trend shifts.",
}


def _config_weights(overrides: dict | None) -> dict:
    """Merge caller-provided weight overrides with defaults.

    Weights are normalized so the total == 100. Unknown keys are ignored.
    """
    weights = dict(DEFAULT_WEIGHTS)
    if overrides:
        for k in weights:
            if k in overrides and isinstance(overrides[k], (int, float)):
                weights[k] = max(0, float(overrides[k]))
    total = sum(weights.values())
    if total <= 0:
        return dict(DEFAULT_WEIGHTS)
    return {k: round(v / total * 100, 2) for k, v in weights.items()}


def _severity_from_cvss(score) -> str | None:
    if score is None:
        return None
    score = float(score)
    if score >= 9.0:
        return "Critical"
    if score >= 7.0:
        return "High"
    if score >= 4.0:
        return "Medium"
    return "Low"


def _parse_date(date_str: str | None):
    if not date_str:
        return None
    for fmt in ("%Y-%m-%d", "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S"):
        try:
            return datetime.strptime(date_str[:19], fmt).replace(tzinfo=timezone.utc)
        except Exception:
            continue
    return None


def calculate_risk_assessment(
    cve_data: dict,
    affected_assets: list[dict] | None = None,
    weight_overrides: dict | None = None,
) -> dict:
    """Produce a full risk assessment from the assembled CVE data dict.

    The cve_data dict should contain:
        best_cvss: { score, severity, version }
        epss: { score, previous_score, percentile } | null
        kev: { vendor, product, date_added, due_date, ... } | null
        exploits: [{ url, name, stars }] | []
        published_date: str | null        (ISO date)
        modified_date: str | null

    Returns:
        {
            "score": 0-100,
            "level": "Critical" | "High" | "Medium" | "Low",
            "priority": "P1" | "P2" | "P3" | "P4",
            "signals": [ { name, label, value, max, weight, reason? }, ... ],
            "reasons": [ str, ... ],
            "recommendation": str,
            "trends": { "epss_delta", "kev_recent" },
        }
    """
    weights = _config_weights(weight_overrides)
    signals = []
    reasons = []
    total = 0.0

    cvss = cve_data.get("best_cvss") or {}
    cvss_score = cvss.get("score") or 0
    severity = cvss.get("severity") or "Unknown"

    epss = cve_data.get("epss") or {}
    epss_score = epss.get("score") or 0
    prev_epss = epss.get("previous_score")
    epss_delta = (epss_score - prev_epss) if prev_epss is not None else None

    kev = cve_data.get("kev")
    has_kev = kev is not None

    exploits = cve_data.get("exploits") or []
    has_exploit = len(exploits) > 0
    top_stars = exploits[0].get("stars", 0) if exploits else 0

    affects = []
    if affected_assets:
        affects = affected_assets

    # --- 1. CVSS severity (weighted) ---
    cvss_max = weights["cvss"]
    if cvss_score:
        cvss_points = round((float(cvss_score) / 10) * cvss_max)
    else:
        cvss_points = 0
    total += cvss_points
    signals.append({
        "name": "cvss",
        "label": f"CVSS {severity} ({cvss_score}/10)",
        "value": cvss_points,
        "max": cvss_max,
        "weight": f"{weights['cvss']:.0f}%",
    })
    if cvss_score >= 9.0:
        reasons.append(f"Critical technical severity (CVSS {cvss_score:.1f})")
    elif cvss_score >= 7.0:
        reasons.append(f"High technical severity (CVSS {cvss_score:.1f})")
    elif cvss_score >= 4.0:
        reasons.append(f"Moderate technical severity (CVSS {cvss_score:.1f})")
    else:
        reasons.append("Low technical severity")

    # --- 2. EPSS exploitation probability + trend (weighted) ---
    epss_max = weights["epss"]
    epss_points = round(float(epss_score) * epss_max)
    total += epss_points
    pct_label = f"{float(epss_score) * 100:.1f}%"
    trend_arrow = ""
    if epss_delta is not None:
        trend_arrow = " ↑" if epss_delta > 0.01 else (" ↓" if epss_delta < -0.01 else " →")
    if epss_score >= 0.7:
        label_rank = "Very High"
        reasons.append(f"Very high exploitation probability (EPSS {pct_label})")
    elif epss_score >= 0.4:
        label_rank = "High"
        reasons.append(f"High exploitation probability (EPSS {pct_label})")
    elif epss_score >= 0.1:
        label_rank = "Moderate"
        reasons.append(f"Moderate exploitation probability (EPSS {pct_label})")
    else:
        label_rank = "Low"
        reasons.append(f"Low exploitation probability (EPSS {pct_label})")
    signals.append({
        "name": "epss",
        "label": f"EPSS {pct_label} — {label_rank}{trend_arrow}",
        "value": epss_points,
        "max": epss_max,
        "weight": f"{weights['epss']:.0f}%",
    })
    if epss_delta is not None:
        delta_pct = abs(epss_delta) * 100
        if epss_delta > 0.01:
            signals[-1]["reason"] = f"EPSS rose {delta_pct:.1f} pts vs previous value"
            reasons.append(f"EPSS trending upward (+{delta_pct:.1f}%) — exploitation likelihood increasing")
        elif epss_delta < -0.01:
            reasons.append(f"EPSS trending downward ({delta_pct:.1f}%) — likelihood decreasing")

    # --- 3. KEV confirmed exploitation (weighted) + recency maturity ---
    kev_max = weights["kev"]
    kev_points = kev_max if has_kev else 0
    kev_recent = False
    if has_kev:
        total += kev_points
        kev_reason = "Confirmed exploitation in the wild (CISA KEV catalog)"
        date_added = kev.get("date_added")
        added_dt = _parse_date(str(date_added)) if date_added else None
        if added_dt and datetime.now(timezone.utc) - added_dt <= timedelta(days=90):
            kev_recent = True
            kev_reason += " — added recently (within 90 days)"
            reasons.append(kev_reason)
        else:
            reasons.append(kev_reason)
        if kev.get("known_ransomware_campaign_use"):
            reasons.append("Exploited in known ransomware campaigns")
    signals.append({
        "name": "kev",
        "label": ("CISA KEV — Confirmed exploited (recent)" if kev_recent and has_kev
                  else "CISA KEV — Confirmed exploited" if has_kev else "Not in CISA KEV"),
        "value": kev_points,
        "max": kev_max,
        "weight": f"{weights['kev']:.0f}%",
    })

    # --- 4. Public exploit availability (weighted) ---
    exploit_max = weights["exploit"]
    if has_exploit and top_stars > 100:
        exploit_points = round(exploit_max)
        reasons.append(f"Widely available exploit code ({top_stars} stars)")
    elif has_exploit:
        exploit_points = round(exploit_max * 0.66)
        reasons.append("Public exploit code available")
    else:
        exploit_points = 0
    total += exploit_points
    signals.append({
        "name": "exploit",
        "label": f"{len(exploits)} exploit source{'s' if len(exploits) != 1 else ''}" if has_exploit else "No public exploits",
        "value": exploit_points,
        "max": exploit_max,
        "weight": f"{weights['exploit']:.0f}%",
    })

    # --- 5. Temporal maturity (weighted) — fresh disclosure in active attack window ---
    temporal_max = weights["temporal"]
    temporal_points = 0
    age_days = None
    published = _parse_date(str(cve_data.get("published_date"))) if cve_data.get("published_date") else None
    now = datetime.now(timezone.utc)
    if published:
        age_days = (now - published).days
        if age_days <= 30:
            temporal_points = round(temporal_max)
            reasons.append(f"Recently disclosed ({age_days}d old) — active exploitation window")
        elif age_days <= 120:
            temporal_points = round(temporal_max * 0.66)
            reasons.append(f"Moderately recent disclosure ({age_days}d old)")
        elif age_days <= 365 and (has_kev or has_exploit):
            temporal_points = round(temporal_max * 0.33)
            reasons.append(f"Disclosed within past year and actively targeted")
    total += temporal_points
    signals.append({
        "name": "temporal",
        "label": f"{age_days}d old" if published else "Disclosure age unknown",
        "value": temporal_points,
        "max": temporal_max,
        "weight": f"{weights['temporal']:.0f}%",
    })

    # --- Final score ---
    score = min(100, round(total))

    level, priority = "Low", "P4"
    for threshold, lvl, pri in THRESHOLDS:
        if score >= threshold:
            level, priority = lvl, pri
            break

    return {
        "score": score,
        "level": level,
        "priority": priority,
        "signals": signals,
        "reasons": reasons,
        "recommendation": RECOMMENDATIONS[priority],
        "trends": {
            "epss_delta": epss_delta,
            "kev_recent": kev_recent,
        },
    }