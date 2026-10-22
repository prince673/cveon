# CVEon

CVEon is an anonymous, client-side vulnerability intelligence platform for security engineers and researchers. It runs entirely in your browser, aggregates CVE telemetry from public sources, computes explainable risk scores, and provides structured testing guides for authorized vulnerability assessment.

## Privacy Model — Nothing Is Stored, Ever

CVEon is intentionally serverless and stateless. There is **no backend, no database, no cache, and no account system**:

- **No storage on your side of the network**: the operator runs a static file server only. There is no server component that could record who searched for what. Every lookup executes in *your* browser and talks directly to the public feeds.
- **No storage in your browser**: no cookies, no tracking IDs, no localStorage databases. The only thing ever written is a single `sessionStorage` flag (your disclaimer acknowledgement), which is erased when you close the tab.
- **No third-party trackers**: no analytics, no ad networks, no CDN fonts. A strict Content-Security-Policy allows only `self` and the five public intelligence APIs listed below.
- **Anonymity at the data source**: no API keys are used anywhere. Public feed rate limits are respected client-side by retrying with exponential backoff (honouring `Retry-After`) and by throttling batch lookups to a bounded concurrency pool.
- **Everything volatile**: search results, batches, and in-memory caches live only in RAM and vanish on reload.

Data sources queried by the browser, with no credentials:

| Source | Use |
| --- | --- |
| NIST NVD (API 2.0) | Primary CVE metadata + CVSS 4.0/3.1/3.0/2.0 |
| CIRCL CVE API | Fallback CVE metadata |
| FIRST EPSS | Exploit Prediction Scoring System |
| CISA KEV | Known Exploited Vulnerabilities |
| GitHub Search | Public exploit repositories |

## What It Does

- **CVE Telemetry & Enrichment**: vulnerability data across NVD, CIRCL, CISA KEV, and FIRST EPSS.
- **Explainable Risk Scoring**: real-world risk based on CVSS scores, active exploitation indicators, and EPSS percentiles.
- **Exploitation & Verification Guides**: structured testing steps and payload concepts for authorized remediation and security verification.
- **Batch Analysis & Compare**: paced, retry-capable analysis of CVE lists and side-by-side comparison.
- **Deep Links**: hash routing (`#/cve/CVE-2021-44228`, `#/batch`, `#/compare`) makes every view shareable and reload-safe.

## Quick Start

### Local Development
```bash
npm install
npm run dev
```
Runs the dashboard at `http://localhost:5173`.

### Docker (static serving only)
```bash
docker compose up -d --build
```
Runs a single nginx container serving the built bundle at `http://localhost:80`. That is the entire stack — there are no other services.

### Continuous Deployment
`.github/workflows/deploy.yml` builds the bundle and publishes it to GitHub Pages on `main`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Production bundle (`dist/`) |
| `npm run preview` | Serve the production bundle locally |
| `npm run lint` | ESLint |
| `npm test` | Vitest suite |

## Disclaimer

This tool is intended strictly for authorized security research, vulnerability assessment, and educational defense. Unauthorized testing against systems without permission is illegal.
