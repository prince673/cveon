# CVEon

CVEon is a vulnerability intelligence platform designed for security engineers and researchers. It aggregates CVE telemetry, computes risk scores, and provides testing guides for authorized vulnerability assessments.

## What It Does

- **CVE Telemetry & Enrichment**: Queries vulnerability data across NVD, CIRCL, CISA KEV (Known Exploited Vulnerabilities), and FIRST EPSS (Exploit Prediction Scoring System).
- **Explainable Risk Scoring**: Evaluates real-world risk based on CVSS scores, active exploitation indicators, and EPSS percentiles.
- **Exploitation & Verification Guides**: Provides structured testing steps and payload concepts for authorized remediation and security verification.
- **Batch Analysis & Compare**: Analyzes lists of CVEs simultaneously and compares vulnerability attributes side-by-side.
- **Remediation Tracking**: Monitors remediation progress, tracking status and mitigation notes.

## Quick Start

### Frontend (Client-only / Development)
```bash
npm install
npm run dev
```
Runs the client dashboard locally at `http://localhost:5173`.

### Full Stack (Docker)
```bash
docker compose up -d --build
```
Runs the frontend, FastAPI backend, PostgreSQL, and Redis stack at `http://localhost:80`.

## Disclaimer

This tool is intended strictly for authorized security research, vulnerability assessment, and educational defense. Unauthorized testing against systems without permission is illegal.
