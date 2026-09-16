/**
 * Enhanced guide engine with:
 * - Multi-signal classification (CWE + CVSS + description + references + product)
 * - Confidence scoring with evidence chain
 * - Primary + secondary classifications
 * - CVE-specific reasoning vs generic guide distinction
 * - Explainability for every classification decision
 */

import GUIDES from '../data/guideTemplates'
import { getClassTechniques } from '../data/mitreData'

const CWE_MAP = {
  'CWE-89': 'sqli', 'CWE-564': 'sqli',
  'CWE-79': 'xss', 'CWE-80': 'xss',
  'CWE-78': 'cmdinj', 'CWE-77': 'cmdinj', 'CWE-88': 'cmdinj',
  'CWE-22': 'traversal', 'CWE-23': 'traversal', 'CWE-35': 'traversal',
  'CWE-98': 'lfi',
  'CWE-502': 'deser',
  'CWE-918': 'ssrf', 'CWE-406': 'ssrf',
  'CWE-611': 'xxe', 'CWE-827': 'xxe',
  'CWE-284': 'idor', 'CWE-639': 'idor', 'CWE-285': 'idor',
  'CWE-601': 'redirect',
  'CWE-94': 'rce', 'CWE-74': 'rce', 'CWE-917': 'rce',
  'CWE-1336': 'ssti',
  'CWE-347': 'jwt', 'CWE-327': 'jwt', 'CWE-345': 'jwt',
  'CWE-352': 'csrf',
  'CWE-434': 'fileupload', 'CWE-436': 'fileupload',
  'CWE-943': 'nosqli',
  'CWE-90': 'ldapi',
  'CWE-643': 'xpath',
  'CWE-120': 'bufferoverflow', 'CWE-121': 'bufferoverflow', 'CWE-122': 'bufferoverflow', 'CWE-787': 'bufferoverflow',
  'CWE-521': 'weakauth', 'CWE-522': 'weakauth', 'CWE-798': 'weakauth',
  'CWE-200': 'infodisc', 'CWE-209': 'infodisc', 'CWE-538': 'infodisc', 'CWE-598': 'infodisc',
  'CWE-362': 'race', 'CWE-367': 'race', 'CWE-370': 'race',
  'CWE-310': 'crypto', 'CWE-326': 'crypto', 'CWE-328': 'crypto',
  'CWE-444': 'smuggling',
  'CWE-644': 'hostheader',
  'CWE-93': 'crlf', 'CWE-113': 'crlf', 'CWE-117': 'crlf',
  'CWE-525': 'cachepoison',
  'CWE-915': 'prototype', 'CWE-1321': 'prototype',
  'CWE-1021': 'clickjacking',
  'CWE-384': 'sessionfix', 'CWE-613': 'sessionfix',
  'CWE-650': 'httpverb',
  'CWE-400': 'redos', 'CWE-1333': 'redos',
  'CWE-287': 'oauth', 'CWE-602': 'oauth', 'CWE-862': 'oauth', 'CWE-863': 'oauth',
}

const KEYWORD_MAP = [
  [/sql\s*inject|sqli\b|UNION\s+SELECT|blind\s*inject/i, 'sqli'],
  [/cross.site\s*script|xss\b|innerHTML|document\.cookie/i, 'xss'],
  [/command\s*inject|os\s*command|shell\s*inject/i, 'cmdinj'],
  [/path\s*travers|directory\s*travers|\.\.\//i, 'traversal'],
  [/file\s*inclus|php:\/\/|include\s*\(.*\$/i, 'lfi'],
  [/deserializ|unserializ|pickle|marshal/i, 'deser'],
  [/server.side\s*request\s*forg|ssrf\b|169\.254\.169\.254/i, 'ssrf'],
  [/xml\s*external\s*entity|xxe\b|DOCTYPE.*ENTITY/i, 'xxe'],
  [/insecure\s*direct\s*object|idor\b|unauthorized.*object|broken\s*access/i, 'idor'],
  [/open\s*redirect|unvalidated\s*redirect/i, 'redirect'],
  [/template\s*inject|ssti\b|jinja|twig|freemarker|thymeleaf|mustache/i, 'ssti'],
  [/json\s*web\s*token|jwt\b|algorithm.*confusion|alg.*none|token.*forg/i, 'jwt'],
  [/cross.site\s*request\s*forg|csrf\b|xsrf\b/i, 'csrf'],
  [/file\s*upload|unrestricted.*upload|arbitrary.*file.*write|webshell/i, 'fileupload'],
  [/remote\s*code|code\s*exec|rce\b|arbitrary\s*code|jndi|log4j|log4shell/i, 'rce'],
  [/nosql|mongodb.*(inject|query|xss)|mongo.*inject|\$\s*ne\b|\$\s*gt\b|\$\s*where/i, 'nosqli'],
  [/ldap\s*inject|ldap.*bind|ldap.*filter|distinguished\s*name/i, 'ldapi'],
  [/xpath\s*inject|xpath\b|count\(\s*\/\/|substring\(/i, 'xpath'],
  [/buffer\s*overflow|stack\s*overflow|heap\s*overflow|buffer\s*underflow|out.of.bounds|ret2libc|eip\b/i, 'bufferoverflow'],
  [/default\s*credential|hard.coded\s*credential|weak\s*password|default\s*password|default\s*login/i, 'weakauth'],
  [/information\s*disclos|sensitive\s*(info|data).*expos|information\s*leak|data\s*expos|\/\.git|stack\s*trace.*disclos/i, 'infodisc'],
  [/race\s*condition|time.of.check|time.of.use|toctou|double.spend|concurrent.*(access|request|write)/i, 'race'],
  [/weak\s*crypto|deprecated\s*cipher|weak\s*encryption|inadequate\s*encryption|cryptographic\s*algorithm|padding\s*oracle|insecure\s*cipher/i, 'crypto'],
  [/request\s*smuggl|te\.cl\b|cl\.te\b|http[/]?2.*smuggl|h2\.cl\b|h2\.te\b|chunked.*(length|smuggl)/i, 'smuggling'],
  [/subdomain\s*takeover|dangling\s*(cname|dns|record)|takeover.*(azure|heroku|s3|shopify)/i, 'subdomain'],
  [/host\s*header\s*(inject|attack|poison)|header.*poison|invalid\s*host.*(redirect|inject)|x.forwarded.host/i, 'hostheader'],
  [/crlf|response\s*splitting|carriage.return.*line.feed|log\s*inject|http\s*response\s*split/i, 'crlf'],
  [/cache\s*poison|cache\s*decept|web\s*cache\s*poison|unkeyed\s*(header|input|component|cookie)/i, 'cachepoison'],
  [/prototype\s*pollution|__proto__|constructor\.prototype/i, 'prototype'],
  [/clickjack|click.jack|ui\s*redress|frame\s*inject|frame.*bust|framable/i, 'clickjacking'],
  [/session\s*fixation|session\s*hijack|session\s*prediction|inadequate\s*session.*(manage|id)|session.*rotate/i, 'sessionfix'],
  [/http\s*(verb|method).*tamper|verb\s*tamper|method\s*tamper|arbitrary\s*http\s*method|trusting\s*http\s*permission/i, 'httpverb'],
  [/zip\s*slip|zip.*(travers|extract|entry|slip)|archive.*(travers|extract|unzip)|path.*travers.*(zip|archive)/i, 'zipslip'],
  [/regular\s*expression.*(denial|dos|resource)|redos|catastrophic\s*backtracking|regex.*denial/i, 'redos'],
  [/oauth2?\b|openid\s*connect|authorization\s*code.*(steal|leak|intercept)|redirect_uri.*(open|validation)/i, 'oauth'],
]

const CWE_DESCRIPTIONS = {
  'CWE-89': 'SQL Injection',
  'CWE-79': 'Cross-site Scripting',
  'CWE-78': 'OS Command Injection',
  'CWE-22': 'Path Traversal',
  'CWE-502': 'Deserialization of Untrusted Data',
  'CWE-918': 'Server-Side Request Forgery',
  'CWE-611': 'XML External Entity',
  'CWE-284': 'Improper Access Control',
  'CWE-601': 'Open Redirect',
  'CWE-94': 'Code Injection',
  'CWE-1336': 'Server-Side Template Injection',
  'CWE-347': 'Improper Verification of Cryptographic Signature',
  'CWE-352': 'Cross-Site Request Forgery',
  'CWE-434': 'Unrestricted Upload of File',
  'CWE-20': 'Improper Input Validation',
  'CWE-77': 'Command Injection',
  'CWE-287': 'Improper Authentication',
  'CWE-798': 'Hard-coded Credentials',
  'CWE-862': 'Missing Authorization',
  'CWE-863': 'Incorrect Authorization',
  'CWE-943': 'Improper Neutralization of Special Elements in Data Query Logic',
  'CWE-90': 'LDAP Injection',
  'CWE-643': 'XPath Injection',
  'CWE-120': 'Buffer Copy without Checking Size',
  'CWE-121': 'Stack-based Buffer Overflow',
  'CWE-122': 'Heap-based Buffer Overflow',
  'CWE-787': 'Out-of-bounds Write',
  'CWE-521': 'Weak Password Requirements',
  'CWE-522': 'Insufficiently Protected Credentials',
  'CWE-200': 'Exposure of Sensitive Information',
  'CWE-209': 'Generation of Error Message Containing Sensitive Information',
  'CWE-538': 'Insertion of Sensitive Information into Externally-Accessible File or Directory',
  'CWE-598': 'Use of GET Request Method with Sensitive Query Strings',
  'CWE-362': 'Race Condition',
  'CWE-367': 'Time-of-check Time-of-use (TOCTOU) Race Condition',
  'CWE-370': 'Missing Check for Certificate Revocation after Initial Check',
  'CWE-310': 'Cryptographic Issues',
  'CWE-326': 'Inadequate Encryption Strength',
  'CWE-328': 'Reversible One-Way Hash',
  'CWE-444': 'Inconsistent Interpretation of HTTP Requests',
  'CWE-644': 'Improper Neutralization of HTTP Headers',
  'CWE-93': 'Improper Neutralization of CRLF Sequences',
  'CWE-113': 'Improper Neutralization of CRLF Sequences in HTTP Headers',
  'CWE-117': 'Improper Output Neutralization for Logs',
  'CWE-525': 'Use of Web Browser Cache Containing Sensitive Information',
  'CWE-915': 'Improperly Controlled Modification of Dynamically-Determined Object Attributes',
  'CWE-1321': 'Improperly Controlled Modification of Object Prototype Attributes',
  'CWE-1021': 'Improper Restriction of Rendered UI Layers or Frames',
  'CWE-384': 'Session Fixation',
  'CWE-613': 'Insufficient Session Expiration',
  'CWE-650': 'Trusting HTTP Permission Methods Based on a Badly-Formed Property',
  'CWE-400': 'Uncontrolled Resource Consumption',
  'CWE-1333': 'Inefficient Regular Expression Complexity',
  'CWE-602': 'Client-Side Enforcement of Server-Side Security',
}

function classifyByCWE(cwes) {
  const results = []
  const evidence = []
  for (const cwe of cwes) {
    if (CWE_MAP[cwe]) {
      results.push({ key: CWE_MAP[cwe], confidence: 85, source: 'cwe' })
      evidence.push(`CWE mapping: ${cwe} → ${CWE_DESCRIPTIONS[cwe] || cwe}`)
    }
  }
  return { results, evidence }
}

function classifyByKeywords(description) {
  const results = []
  const evidence = []
  const lower = (description || '').toLowerCase()
  for (const [pattern, key] of KEYWORD_MAP) {
    const match = lower.match(pattern)
    if (match) {
      results.push({ key, confidence: 60, source: 'keyword', match: match[0] })
      evidence.push(`Description keyword match: "${match[0]}"`)
    }
  }
  return { results, evidence }
}

function classifyByCVSS(cvssVector, cvss3) {
  const evidence = []
  if (!cvssVector) return { results: [], evidence }

  const av = cvssVector.match(/AV:([AECN])/)?.[1]
  const ac = cvssVector.match(/AC:([AH])/)?.[1]
  const pr = cvssVector.match(/PR:([NHL])/)?.[1]
  const ui = cvssVector.match(/UI:([NR])/)?.[1]
  const score = parseFloat(cvss3 || 0)

  if (av === 'N' && ac === 'L' && pr === 'N' && ui === 'N' && score >= 9.0) {
    evidence.push('CVSS vector suggests network-exploitable, low complexity, no auth - likely RCE or critical access control flaw.')
  }
  if (av === 'N' && score >= 7.0) {
    evidence.push('Network-accessible vulnerability with high impact.')
  }

  return { results: [], evidence }
}

function classifyByReferences(refs) {
  const evidence = []
  if (!refs?.length) return { results: [], evidence }

  const refUrls = refs.map(r => (r.url || r).toLowerCase())
  const hasVendorAdvisory = refUrls.some(u =>
    u.includes('vendor') || u.includes('advisory') || u.includes('security') ||
    u.includes('patch') || u.includes('bulletin')
  )
  const hasExploit = refUrls.some(u =>
    u.includes('exploit') || u.includes('github.com') || u.includes('packetstorm')
  )
  const hasNVD = refUrls.some(u => u.includes('nvd.nist.gov'))

  if (hasExploit) evidence.push('References include exploit code repositories.')
  if (hasVendorAdvisory) evidence.push('Vendor advisory available in references.')
  if (hasNVD) evidence.push('NVD reference confirmed.')

  return { results: [], evidence }
}

function classifyByProducts(products, desc) {
  const evidence = []
  if (!products?.length) return { results: [], evidence }

  const descLower = (desc || '').toLowerCase()
  for (const p of products.slice(0, 5)) {
    const pLower = p.toLowerCase()
    if (descLower.includes(pLower)) {
      evidence.push(`Affected product "${p}" confirmed in description.`)
    }
  }

  return { results: [], evidence }
}

export function classifyVulnerability(cveData) {
  const allResults = []
  const allEvidence = []

  const cweClass = classifyByCWE(cveData.cwes || [])
  allResults.push(...cweClass.results)
  allEvidence.push(...cweClass.evidence)

  const kwClass = classifyByKeywords(cveData.description)
  allResults.push(...kwClass.results)
  allEvidence.push(...kwClass.evidence)

  const bestCvss = cveData.best_cvss || {}
  const cvssClass = classifyByCVSS(bestCvss.vector_string, bestCvss.score)
  allResults.push(...cvssClass.results)
  allEvidence.push(...cvssClass.evidence)

  const refClass = classifyByReferences(cveData.references)
  allResults.push(...refClass.results)
  allEvidence.push(...refClass.evidence)

  const prodClass = classifyByProducts(cveData.products, cveData.description)
  allResults.push(...prodClass.results)
  allEvidence.push(...prodClass.evidence)

  const aggregated = {}
  for (const r of allResults) {
    if (!aggregated[r.key]) aggregated[r.key] = { key: r.key, sources: [], totalConfidence: 0 }
    aggregated[r.key].sources.push(r.source)
    aggregated[r.key].totalConfidence += r.confidence
  }

  const sorted = Object.values(aggregated)
    .sort((a, b) => b.totalConfidence - a.totalConfidence)

  const primary = sorted[0] || null
  const secondary = sorted.slice(1)

  let overallConfidence = 0
  if (primary) {
    const sourceCount = primary.sources.length
    overallConfidence = Math.min(99, primary.totalConfidence + (sourceCount - 1) * 10)
    if (kwClass.results.length === 0 && cweClass.results.length === 0) overallConfidence = 20
    if (cweClass.results.length > 0 && kwClass.results.length > 0) overallConfidence = Math.min(99, overallConfidence + 10)
  }

  const isGeneric = !primary || overallConfidence < 40

  return {
    primary: primary ? primary.key : 'generic',
    primaryLabel: primary ? (GUIDES[primary.key]?.name || primary.key) : 'General Vulnerability',
    secondary: secondary.map(s => ({ key: s.key, label: GUIDES[s.key]?.name || s.key })),
    confidence: overallConfidence,
    confidenceLabel: overallConfidence >= 80 ? 'High' : overallConfidence >= 50 ? 'Moderate' : overallConfidence >= 30 ? 'Low' : 'Very Low',
    evidence: allEvidence,
    isGeneric,
    allMatches: sorted,
    classifiedAt: new Date().toISOString(),
  }
}

export function selectGuideKey(cveData) {
  const classification = classifyVulnerability(cveData)
  return classification.primary
}

export function buildGuide(cveData) {
  const classification = classifyVulnerability(cveData)
  const key = classification.primary
  const template = GUIDES[key] || GUIDES.generic

  const resources = (template.resources || []).map(u => u.replace('CVE_ID', cveData.cve_id))
  resources.push(`https://nvd.nist.gov/vuln/detail/${cveData.cve_id}`)
  resources.push(`https://www.exploit-db.com/search?cve=${cveData.cve_id}`)
  resources.push(`https://cve.mitre.org/cgi-bin/cvename.cgi?name=${cveData.cve_id}`)
  resources.push(`https://packetstormsecurity.com/search/?q=${cveData.cve_id}`)
  resources.push(`https://github.com/search?q=${cveData.cve_id}`)

  // ── Real CVE-specific enrichment from the live data ──
  const cveId = cveData.cve_id
  const exploits = cveData.exploits || []
  const references = cveData.references || []
  const products = cveData.products || []
  const kev = cveData.kev || null

  // MITRE ATT&CK techniques for the classified weakness (class-level mapping)
  const attackTechniques = getClassTechniques(key)

  // Related CVEs referenced in this CVE's description / references (CVE chaining)
  const relatedCves = []
  const descText = `${cveData.description || ''} ${(cveData.references || []).join(' ')}`
  const cveMatches = descText.match(/CVE-\d{4}-\d{4,}/gi) || []
  for (const m of cveMatches) {
    const id = m.toUpperCase()
    if (id !== cveId && !relatedCves.includes(id)) relatedCves.push(id)
  }

  // Use the first affected product/vendor as the auto-filled target URL hint
  const targetHint = products.length
    ? products[0].split(':').filter(Boolean).join('/')
    : '[TARGET_URL]'

  // Real exploit repos → deep "Exploitation" tab entries per PoC
  const exploitSteps = exploits.map((x, i) => ({
    t: `PoC #${i + 1}: ${x.name || x.url.split('/').pop()}`,
    b: `Public proof-of-concept. Inspect the code and adapt it to the target. ${x.stars ? `(${x.stars} GitHub stars = widely validated.)` : ''}`,
    cmd: `git clone ${x.url}`,
    link: x.url,
  }))
  // If no real PoCs, fall back to the generic template exploit steps
  const exploit = exploitSteps.length ? exploitSteps : template.exploit

  // Real advisory/technical references → DETECTION depth
  const advisoryRefs = references
    .filter(r => /advisory|security|patch|bulletin|github|kb\.|cisa|github\.com/i.test(r))
    .slice(0, 8)
  const detectSteps = (template.detect || []).map(s => ({
    ...s,
    b: `${s.b} Verify the target is running an affected product (${targetHint}) and version per the CVE records below.`,
  }))
  if (advisoryRefs.length) {
    detectSteps.unshift({
      t: `Read the official advisory for ${cveId}`,
      b: 'Start by reading the vendor/NVD advisory to confirm the exact vulnerable versions and the fix.',
      link: advisoryRefs[0],
    })
  }

  // KEV required action → top MITIGATION priority (real CVE-specific)
  let mitigate = template.mitigate || []
  if (kev && kev.required_action) {
    mitigate = [
      {
        t: 'CISA required action (known exploited)',
        b: kev.required_action,
      },
      ...mitigate,
    ]
  }

  const isCVEspecific = !classification.isGeneric && classification.confidence >= 50

  const resourcesSet = []
  for (const r of resources) {
    if (!resourcesSet.includes(r)) resourcesSet.push(r)
  }
  // Append real exploit URLs to resources
  for (const x of exploits) {
    if (!resourcesSet.includes(x.url)) resourcesSet.push(x.url)
  }

  return {
    key,
    name: template.name,
    detect: detectSteps,
    exploit,
    mitigate,
    // Surface the real exploit/reference data for the UI
    exploitSources: exploits,
    advisories: references,
    targetHint,
    resources: resourcesSet,
    classification,
    isCVEspecific,
    attackTechniques,
    relatedCves,
    disclaimer: isCVEspecific
      ? `This guide is classified as "${classification.primaryLabel}" with ${classification.confidence}% confidence based on ${classification.evidence.length} evidence signals.`
      : `No specific vulnerability type could be confidently identified. Showing general educational information. Classification confidence: ${classification.confidence}%.`,
  }
}

export function getAllGuideTypes() {
  return Object.entries(GUIDES).map(([key, g]) => ({ key, name: g.name }))
}
