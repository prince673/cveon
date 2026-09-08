import { describe, it, expect } from 'vitest'
import { classifyVulnerability, buildGuide, selectGuideKey } from '../src/utils/guideEngine'

describe('Classification Engine', () => {
  describe('classifyVulnerability', () => {
    it('classifies SQL injection by CWE-89', () => {
      const result = classifyVulnerability({
        cwes: ['CWE-89'],
        description: 'A SQL injection vulnerability allows attackers to execute arbitrary SQL queries.',
      })
      expect(result.primary).toBe('sqli')
      expect(result.confidence).toBeGreaterThanOrEqual(70)
      expect(result.evidence.length).toBeGreaterThan(0)
      expect(result.isGeneric).toBe(false)
    })

    it('classifies XSS by CWE-79', () => {
      const result = classifyVulnerability({
        cwes: ['CWE-79'],
        description: 'Cross-site scripting vulnerability in the web application.',
      })
      expect(result.primary).toBe('xss')
      expect(result.confidence).toBeGreaterThanOrEqual(70)
    })

    it('classifies RCE by description keywords', () => {
      const result = classifyVulnerability({
        cwes: [],
        description: 'Remote code execution vulnerability allows attackers to run arbitrary code on the server.',
      })
      expect(result.primary).toBe('rce')
      expect(result.confidence).toBeGreaterThanOrEqual(40)
    })

    it('classifies SSRF by CWE-918', () => {
      const result = classifyVulnerability({
        cwes: ['CWE-918'],
        description: 'Server-side request forgery allows internal network access.',
      })
      expect(result.primary).toBe('ssrf')
    })

    it('classifies XXE by CWE-611', () => {
      const result = classifyVulnerability({
        cwes: ['CWE-611'],
        description: 'XML external entity injection vulnerability.',
      })
      expect(result.primary).toBe('xxe')
    })

    it('classifies path traversal by CWE-22', () => {
      const result = classifyVulnerability({
        cwes: ['CWE-22'],
        description: 'Path traversal allows reading arbitrary files.',
      })
      expect(result.primary).toBe('traversal')
    })

    it('classifies deserialization by CWE-502', () => {
      const result = classifyVulnerability({
        cwes: ['CWE-502'],
        description: 'Insecure deserialization leads to remote code execution.',
      })
      expect(result.primary).toBe('deser')
    })

    it('classifies IDOR by CWE-284', () => {
      const result = classifyVulnerability({
        cwes: ['CWE-284'],
        description: 'Broken access control allows unauthorized object access.',
      })
      expect(result.primary).toBe('idor')
    })

    it('classifies JWT vulnerability by CWE-347', () => {
      const result = classifyVulnerability({
        cwes: ['CWE-347'],
        description: 'Improper verification of JWT token signature.',
      })
      expect(result.primary).toBe('jwt')
    })

    it('classifies CSRF by CWE-352', () => {
      const result = classifyVulnerability({
        cwes: ['CWE-352'],
        description: 'Cross-site request forgery vulnerability.',
      })
      expect(result.primary).toBe('csrf')
    })

    it('returns generic for unknown CWE', () => {
      const result = classifyVulnerability({
        cwes: ['CWE-999'],
        description: 'Some unknown vulnerability type.',
      })
      expect(result.isGeneric).toBe(true)
    })

    it('provides evidence chain', () => {
      const result = classifyVulnerability({
        cwes: ['CWE-89'],
        description: 'SQL injection in login form allows UNION SELECT queries.',
        references: [{ url: 'https://exploit-db.com/12345' }],
        products: ['MySQL'],
      })
      expect(result.evidence.length).toBeGreaterThanOrEqual(2)
      expect(result.evidence.some(e => e.includes('CWE'))).toBe(true)
    })

    it('increases confidence with multiple evidence sources', () => {
      const singleSource = classifyVulnerability({
        cwes: ['CWE-89'],
        description: '',
      })
      const multiSource = classifyVulnerability({
        cwes: ['CWE-89'],
        description: 'SQL injection allows arbitrary queries.',
        references: [{ url: 'https://exploit-db.com/123' }],
      })
      expect(multiSource.confidence).toBeGreaterThanOrEqual(singleSource.confidence)
    })
  })

  describe('selectGuideKey', () => {
    it('selects correct guide key for SQLi', () => {
      const key = selectGuideKey({ cwes: ['CWE-89'], description: '' })
      expect(key).toBe('sqli')
    })

    it('selects correct guide key for XSS', () => {
      const key = selectGuideKey({ cwes: ['CWE-79'], description: '' })
      expect(key).toBe('xss')
    })

    it('falls back to keyword matching', () => {
      const key = selectGuideKey({ cwes: [], description: 'cross-site scripting vulnerability' })
      expect(key).toBe('xss')
    })

    it('returns generic for unclassifiable', () => {
      const key = selectGuideKey({ cwes: [], description: 'some random vulnerability' })
      expect(key).toBe('generic')
    })
  })

  describe('buildGuide', () => {
    it('builds a complete guide with classification', () => {
      const guide = buildGuide({
        cve_id: 'CVE-2021-44228',
        cwes: ['CWE-94'],
        description: 'Remote code execution via Log4j JNDI lookup.',
        references: [],
      })
      expect(guide).toHaveProperty('key')
      expect(guide).toHaveProperty('name')
      expect(guide).toHaveProperty('detect')
      expect(guide).toHaveProperty('exploit')
      expect(guide).toHaveProperty('mitigate')
      expect(guide).toHaveProperty('resources')
      expect(guide).toHaveProperty('classification')
      expect(guide).toHaveProperty('isCVEspecific')
      expect(guide.classification).toHaveProperty('confidence')
      expect(guide.classification).toHaveProperty('evidence')
    })

    it('includes NVD and exploit-db resources', () => {
      const guide = buildGuide({
        cve_id: 'CVE-2021-44228',
        cwes: ['CWE-94'],
        description: '',
        references: [],
      })
      expect(guide.resources.some(r => r.includes('nvd.nist.gov'))).toBe(true)
      expect(guide.resources.some(r => r.includes('exploit-db.com'))).toBe(true)
      expect(guide.resources.some(r => r.includes('cve.mitre.org'))).toBe(true)
    })

    it('marks generic guide when confidence is low', () => {
      const guide = buildGuide({
        cve_id: 'CVE-9999-0001',
        cwes: [],
        description: 'An unspecified vulnerability.',
        references: [],
      })
      expect(guide.isCVEspecific).toBe(false)
    })

    it('includes MITRE ATT&CK techniques for the classified class', () => {
      const guide = buildGuide({
        cve_id: 'CVE-2021-44228',
        cwes: ['CWE-94'],
        description: 'Remote code execution via Log4j JNDI lookup.',
        references: [],
      })
      expect(Array.isArray(guide.attackTechniques)).toBe(true)
      expect(guide.attackTechniques.length).toBeGreaterThan(0)
      expect(guide.attackTechniques[0]).toHaveProperty('id')
      expect(guide.attackTechniques[0]).toHaveProperty('tactic')
      // RCE class should include T1190 (Exploit Public-Facing Application)
      expect(guide.attackTechniques.some(t => t.id === 'T1190')).toBe(true)
    })

    it('detects related CVEs in description and references (chaining)', () => {
      const guide = buildGuide({
        cve_id: 'CVE-2023-44487',
        cwes: [],
        description: 'Similar to CVE-2022-47929 and related to CVE-2017-1000050.',
        references: ['https://nvd.nist.gov/vuln/detail/CVE-2022-47929'],
      })
      expect(guide.relatedCves).toContain('CVE-2022-47929')
      expect(guide.relatedCves).toContain('CVE-2017-1000050')
      expect(guide.relatedCves).not.toContain('CVE-2023-44487')
    })

    it('adds exploit-db, packetstorm and github search resources', () => {
      const guide = buildGuide({
        cve_id: 'CVE-2021-44228',
        cwes: ['CWE-94'],
        description: '',
        references: [],
      })
      expect(guide.resources.some(r => r.includes('packetstormsecurity.com'))).toBe(true)
      expect(guide.resources.some(r => r.includes('github.com/search'))).toBe(true)
    })
  })

  describe('Additional template classification', () => {
    const cases = [
      [{ cwes: ['CWE-943'], description: 'NoSQL injection in MongoDB query.' }, 'nosqli'],
      [{ cwes: ['CWE-90'], description: 'LDAP injection in authentication filter.' }, 'ldapi'],
      [{ cwes: ['CWE-643'], description: 'XPath injection in XML query.' }, 'xpath'],
      [{ cwes: ['CWE-787'], description: 'Out-of-bounds write' }, 'bufferoverflow'],
      [{ cwes: ['CWE-521'], description: 'Weak password requirements allow guessing.' }, 'weakauth'],
      [{ cwes: ['CWE-200'], description: 'Sensitive information exposure in error pages.' }, 'infodisc'],
      [{ cwes: ['CWE-362'], description: 'Race condition allows double spend.' }, 'race'],
      [{ cwes: ['CWE-326'], description: 'Inadequate encryption strength.' }, 'crypto'],
      [{ cwes: ['CWE-444'], description: 'HTTP request smuggling via conflicting headers.' }, 'smuggling'],
      [{ cwes: [], description: 'Subdomain takeover via dangling CNAME record.' }, 'subdomain'],
      [{ cwes: ['CWE-644'], description: 'Host header injection redirects to attacker.' }, 'hostheader'],
      [{ cwes: ['CWE-113'], description: 'CRLF injection in response headers.' }, 'crlf'],
      [{ cwes: [], description: 'Web cache poisoning with an unkeyed header.' }, 'cachepoison'],
      [{ cwes: ['CWE-1321'], description: 'Prototype pollution through __proto__ key.' }, 'prototype'],
      [{ cwes: ['CWE-1021'], description: 'Clickjacking via missing frame restrictions.' }, 'clickjacking'],
      [{ cwes: ['CWE-384'], description: 'Session fixation allows token reuse.' }, 'sessionfix'],
      [{ cwes: ['CWE-650'], description: 'Verb tampering executes denied HTTP methods.' }, 'httpverb'],
      [{ cwes: [], description: 'Zip slip extraction writes files outside the extraction directory.' }, 'zipslip'],
      [{ cwes: ['CWE-1333'], description: 'ReDoS via catastrophic backtracking.' }, 'redos'],
      [{ cwes: ['CWE-863'], description: 'OAuth authorization bypass.' }, 'oauth'],
    ]

    it.each(cases)('classifies %j to %s', (input, expected) => {
      const result = classifyVulnerability(input)
      expect(result.primary).toBe(expected)
      expect(result.isGeneric).toBe(false)
      const guide = buildGuide({ cve_id: 'CVE-TEST-1', ...input, references: [] })
      expect(guide.name.length).toBeGreaterThan(0)
      expect(guide.detect.length).toBeGreaterThan(0)
      expect(guide.exploit.length).toBeGreaterThan(0)
      expect(guide.mitigate.length).toBeGreaterThan(0)
      expect(guide.resources.some(r => r.includes('hacktricks.xyz'))).toBe(true)
    })
  })
})
