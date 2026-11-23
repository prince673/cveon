// Human-readable breakdown of CVSS vector strings (v3.x and v4.0).
// Pure parsing only — no scoring math; the numbers come from NVD.

const METRIC_META = {
  AV:  { name: 'Attack Vector',           values: { N: 'Network', A: 'Adjacent', L: 'Local', P: 'Physical' } },
  AC:  { name: 'Attack Complexity',       values: { L: 'Low', H: 'High' } },
  AT:  { name: 'Attack Requirements',     values: { N: 'None', P: 'Present' } },
  PR:  { name: 'Privileges Required',     values: { N: 'None', L: 'Low', H: 'High' } },
  UI:  { name: 'User Interaction',        values: { N: 'None', P: 'Passive', R: 'Required' } },
  S:   { name: 'Scope',                   values: { U: 'Unchanged', C: 'Changed' } },
  C:   { name: 'Confidentiality Impact',  values: { H: 'High', L: 'Low', N: 'None' } },
  I:   { name: 'Integrity Impact',        values: { H: 'High', L: 'Low', N: 'None' } },
  A:   { name: 'Availability Impact',     values: { H: 'High', L: 'Low', N: 'None' } },
  VC:  { name: 'Vulnerable System — Confidentiality', values: { H: 'High', L: 'Low', N: 'None' } },
  VI:  { name: 'Vulnerable System — Integrity',       values: { H: 'High', L: 'Low', N: 'None' } },
  VA:  { name: 'Vulnerable System — Availability',    values: { H: 'High', L: 'Low', N: 'None' } },
  SC:  { name: 'Subsequent System — Confidentiality', values: { H: 'High', L: 'Low', N: 'None' } },
  SI:  { name: 'Subsequent System — Integrity',       values: { H: 'High', L: 'Low', N: 'None' } },
  SA:  { name: 'Subsequent System — Availability',    values: { H: 'High', L: 'Low', N: 'None' } },
  E:   { name: 'Exploit Maturity',        values: { X: 'Not Defined', U: 'Unreported', P: 'Proof-of-Concept', F: 'Functional', H: 'High' } },
  CR:  { name: 'Confidentiality Requirement', values: { X: 'Not Defined', H: 'High', M: 'Medium', L: 'Low' } },
  IR:  { name: 'Integrity Requirement',       values: { X: 'Not Defined', H: 'High', M: 'Medium', L: 'Low' } },
  AR:  { name: 'Availability Requirement',    values: { X: 'Not Defined', H: 'High', M: 'Medium', L: 'Low' } },
  R:   { name: 'Recovery',                values: { X: 'Not Defined', A: 'Automatic', U: 'User', W: 'Workaround', F: 'Unrecoverable' } },
  V:   { name: 'Value Density',           values: { X: 'Not Defined', D: 'Diffuse', C: 'Concentrated' } },
  RE:  { name: 'Vulnerability Response Effort', values: { X: 'Not Defined', L: 'Low', M: 'Moderate', H: 'High' } },
  U:   { name: 'Provider Urgency',        values: { X: 'Not Defined', Clear: 'Clear', Green: 'Green', Amber: 'Amber', Red: 'Red' } },
  M:   { name: 'Modified metrics',        values: {} },
  MA:  { name: 'Modified metrics',        values: {} },
  MPR: { name: 'Modified Privileges Required', values: { N: 'None', L: 'Low', H: 'High', X: 'Not Defined' } },
  MAC: { name: 'Modified Attack Complexity',   values: { L: 'Low', H: 'High', X: 'Not Defined' } },
  MAV: { name: 'Modified Attack Vector',       values: { N: 'Network', A: 'Adjacent', L: 'Local', P: 'Physical', X: 'Not Defined' } },
  MUI: { name: 'Modified User Interaction',    values: { N: 'None', R: 'Required', X: 'Not Defined' } },
  MS:  { name: 'Modified Scope',               values: { U: 'Unchanged', C: 'Changed', X: 'Not Defined' } },
  MC:  { name: 'Modified Confidentiality',     values: { H: 'High', L: 'Low', N: 'None', X: 'Not Defined' } },
  MI:  { name: 'Modified Integrity',           values: { H: 'High', L: 'Low', N: 'None', X: 'Not Defined' } },
  MAE: { name: 'Modified Availability',        values: { H: 'High', L: 'Low', N: 'None', X: 'Not Defined' } },
}

/**
 * Parse a CVSS vector string into ordered, explained metrics.
 * Returns { version, metrics: [{ key, value, name, valueLabel }] }
 * or null when the string is not a recognizable CVSS vector.
 */
export function parseVector(vectorString) {
  if (typeof vectorString !== 'string') return null
  const parts = vectorString.trim().split('/').filter(Boolean)
  const header = parts.shift() || ''
  const versionMatch = header.match(/^CVSS:(\d\.\d)$/i)
  if (!versionMatch) return null

  const metrics = []
  for (const part of parts) {
    const eq = part.indexOf(':')
    if (eq <= 0) continue
    const key = part.slice(0, eq).toUpperCase()
    const value = part.slice(eq + 1).toUpperCase()
    if (!value) continue
    const meta = METRIC_META[key]
    metrics.push({
      key,
      value,
      name: meta?.name || key,
      valueLabel: meta?.values?.[value] || value,
    })
  }
  if (!metrics.length) return null
  return { version: versionMatch[1], metrics }
}
