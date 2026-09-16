/**
 * MITRE ATT&CK technique mappings for vulnerability classes.
 *
 * Each guide class maps to one or more ATT&CK technique IDs with tactic + name
 * so the ExploitationGuide can surface how an attacker chains this weakness
 * into the kill chain. Techniques link to https://attack.mitre.org/techniques/{ID}
 */

export const ATTACK_TECHNIQUES = {
  'T1059':  { name: 'Command and Scripting Interpreter',          tactic: 'Execution' },
  'T1059.003': { name: 'Windows Command Shell',                   tactic: 'Execution' },
  'T1059.007': { name: 'JavaScript',                              tactic: 'Execution' },
  'T1068':  { name: 'Exploitation for Privilege Escalation',      tactic: 'Privilege Escalation' },
  'T1078':  { name: 'Valid Accounts',                             tactic: 'Defense Evasion' },
  'T1082':  { name: 'System Information Discovery',               tactic: 'Discovery' },
  'T1083':  { name: 'File and Directory Discovery',               tactic: 'Discovery' },
  'T1090':  { name: 'Proxy',                                      tactic: 'Command & Control' },
  'T1003':  { name: 'OS Credential Dumping',                      tactic: 'Credential Access' },
  'T1005':  { name: 'Data from Local System',                     tactic: 'Collection' },
  'T1135':  { name: 'Network Share Discovery',                    tactic: 'Discovery' },
  'T1189':  { name: 'Drive-by Compromise',                        tactic: 'Initial Access' },
  'T1190':  { name: 'Exploit Public-Facing Application',          tactic: 'Initial Access' },
  'T1203':  { name: 'Exploitation for Client Execution',          tactic: 'Execution' },
  'T1204':  { name: 'User Execution',                             tactic: 'Execution' },
  'T1210':  { name: 'Exploitation of Remote Services',            tactic: 'Initial Access' },
  'T1212':  { name: 'Exploitation for Credential Access',         tactic: 'Credential Access' },
  'T1213':  { name: 'Application Access Token',                   tactic: 'Discovery' },
  'T1505.003': { name: 'Web Shell',                               tactic: 'Persistence' },
  'T1550':  { name: 'Use Alternate Authentication Material',      tactic: 'Lateral Movement' },
  'T1553':  { name: 'Subvert Trust Controls',                     tactic: 'Defense Evasion' },
  'T1556':  { name: 'Modify Authentication Process',              tactic: 'Credential Access' },
  'T1562':  { name: 'Impair Defenses',                            tactic: 'Defense Evasion' },
  'T1566':  { name: 'Phishing',                                   tactic: 'Initial Access' },
  'T1567':  { name: 'Exfiltration Over Web Service',              tactic: 'Exfiltration' },
  'T1571':  { name: 'Non-Standard Port',                          tactic: 'Command & Control' },
  'T1499':  { name: 'Endpoint Denial of Service',                 tactic: 'Impact' },
}

export const CLASS_ATTACK_MAP = {
  rce:           ['T1190', 'T1059', 'T1203', 'T1068'],
  sqli:          ['T1190', 'T1059', 'T1082', 'T1003'],
  xss:           ['T1189', 'T1203', 'T1059.007', 'T1566'],
  cmdinj:        ['T1190', 'T1059', 'T1505.003'],
  traversal:     ['T1190', 'T1083', 'T1005'],
  lfi:           ['T1505.003', 'T1083'],
  deser:         ['T1203', 'T1210', 'T1212'],
  ssrf:          ['T1090', 'T1005', 'T1550'],
  xxe:           ['T1005', 'T1083', 'T1550'],
  idor:          ['T1068', 'T1078', 'T1550'],
  redirect:      ['T1566', 'T1204'],
  ssti:          ['T1190', 'T1059', 'T1505.003'],
  jwt:           ['T1550', 'T1553'],
  csrf:          ['T1566', 'T1204'],
  fileupload:    ['T1505.003', 'T1190', 'T1059'],
  nosqli:        ['T1190', 'T1003', 'T1082'],
  ldapi:         ['T1078', 'T1003'],
  xpath:         ['T1003', 'T1082'],
  bufferoverflow: ['T1210', 'T1190', 'T1068'],
  weakauth:      ['T1078', 'T1556', 'T1562'],
  infodisc:      ['T1005', 'T1082', 'T1083'],
  race:          ['T1068', 'T1212'],
  crypto:        ['T1550', 'T1212', 'T1003'],
  smuggling:     ['T1190', 'T1059', 'T1090'],
  subdomain:     ['T1566', 'T1078'],
  hostheader:    ['T1190', 'T1566'],
  crlf:          ['T1562', 'T1567', 'T1566'],
  cachepoison:   ['T1189', 'T1204', 'T1566'],
  prototype:     ['T1190', 'T1059', 'T1068'],
  clickjacking:  ['T1566', 'T1204', 'T1550'],
  sessionfix:    ['T1078', 'T1550', 'T1566'],
  httpverb:      ['T1068', 'T1078'],
  zipslip:       ['T1505.003', 'T1083', 'T1005'],
  redos:         ['T1190', 'T1499'],
  oauth:         ['T1550', 'T1078', 'T1213'],
  generic:       ['T1190', 'T1210', 'T1068'],
}

/**
 * Attack technique info, or null if unknown.
 */
export function getTechniqueInfo(id) {
  return ATTACK_TECHNIQUES[id] || null
}

/**
 * Techniques for a given guide class (deduped, info resolved).
 */
export function getClassTechniques(classKey) {
  const ids = CLASS_ATTACK_MAP[classKey] || []
  const seen = new Set()
  const out = []
  for (const id of ids) {
    if (seen.has(id)) continue
    seen.add(id)
    out.push({ id, ...(getTechniqueInfo(id) || { name: id, tactic: 'Unknown' }) })
  }
  return out
}

export default ATTACK_TECHNIQUES