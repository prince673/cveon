/**
 * Lightweight guide-type registry.
 *
 * This is the ONLY metadata UI panels need (key + display name). It is kept
 * apart from guideTemplates.js — a ~95KB catalog — so home-page components
 * can render guide coverage without loading the full template catalog into
 * the main bundle. The catalog itself loads lazily when a guide is built.
 *
 * KEEP IN SYNC: guideTypes.test.js asserts that every key here has a
 * corresponding entry in guideTemplates.js and vice versa.
 */
export const GUIDE_TYPES = [
  { key: 'sqli',           name: 'SQL Injection (SQLi)' },
  { key: 'xss',            name: 'Cross-Site Scripting (XSS)' },
  { key: 'rce',            name: 'Remote Code Execution (RCE)' },
  { key: 'traversal',      name: 'Path / Directory Traversal' },
  { key: 'lfi',            name: 'Local File Inclusion (LFI)' },
  { key: 'cmdinj',         name: 'OS Command Injection' },
  { key: 'deser',          name: 'Insecure Deserialization' },
  { key: 'ssrf',           name: 'Server-Side Request Forgery (SSRF)' },
  { key: 'xxe',            name: 'XML External Entity (XXE) Injection' },
  { key: 'idor',           name: 'Insecure Direct Object Reference (IDOR)' },
  { key: 'redirect',       name: 'Open Redirect' },
  { key: 'generic',        name: 'General Vulnerability' },
  { key: 'ssti',           name: 'Server-Side Template Injection (SSTI)' },
  { key: 'jwt',            name: 'JWT Vulnerabilities' },
  { key: 'csrf',           name: 'Cross-Site Request Forgery (CSRF)' },
  { key: 'fileupload',     name: 'Malicious File Upload' },
  { key: 'nosqli',         name: 'NoSQL Injection' },
  { key: 'ldapi',          name: 'LDAP Injection' },
  { key: 'xpath',          name: 'XPath Injection' },
  { key: 'bufferoverflow', name: 'Buffer Overflow' },
  { key: 'weakauth',       name: 'Weak Authentication / Default Credentials' },
  { key: 'infodisc',       name: 'Information Disclosure' },
  { key: 'race',           name: 'Race Condition / TOCTOU' },
  { key: 'crypto',         name: 'Weak Cryptography' },
  { key: 'smuggling',      name: 'HTTP Request Smuggling (CL.TE / TE.CL)' },
  { key: 'subdomain',      name: 'Subdomain Takeover' },
  { key: 'hostheader',     name: 'Host Header Injection' },
  { key: 'crlf',           name: 'CRLF / Log Injection' },
  { key: 'cachepoison',    name: 'Web Cache Poisoning' },
  { key: 'prototype',      name: 'Prototype Pollution' },
  { key: 'clickjacking',   name: 'Clickjacking / UI Redress' },
  { key: 'sessionfix',     name: 'Session Fixation / Hijacking' },
  { key: 'httpverb',       name: 'HTTP Method / Verb Tampering' },
  { key: 'zipslip',        name: 'Zip Slip (Archive Extraction)' },
  { key: 'redos',          name: 'Regular Expression DoS (ReDoS)' },
  { key: 'oauth',          name: 'OAuth / OpenID Misconfiguration' },
]
