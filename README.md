# CVE Explorer

A vulnerability intelligence platform with multi-source CVE enrichment, explainable risk scoring, exploitation guides, batch analysis, CVE comparison, and remediation tracking.

## Architecture

```
React (Vite SPA) → Nginx → FastAPI Backend → PostgreSQL
                                 ↓
                      ┌──────────┼──────────┐
                      ↓          ↓          ↓
                 CVE Service  Risk Engine  Guide Engine
                      ↓          ↓          ↓
                 CIRCL/NVD    EPSS/KEV    EPSS/KEV
                      └──────────┬──────────┘
                                 ↓
                          Remediation + Alerts
                                 ↓
                           Celery worker/beat + Redis
```

## Production deployment (Docker)

1. Copy the environment template and set real values (especially `POSTGRES_PASSWORD` and optionally `NVD_API_KEY`):

   ```bash
   cp .env.example .env
   ```

2. Build and start the stack:

   ```bash
   docker compose up -d --build
   ```

3. Verify:

   ```bash
   docker compose ps
   curl http://localhost:8080/api/health
   ```

- Web app: http://localhost:8080 (nginx serves the static bundle and proxies `/api` → backend)
- API docs: http://localhost:8000/docs (only reachable inside the Docker network by default)

### Production stack services

| Service  | Purpose                                                                    |
|----------|----------------------------------------------------------------------------|
| `db`     | PostgreSQL 16 (persistent volume `pgdata`)                                 |
| `redis`  | Celery broker/result backend                                               |
| `backend`| FastAPI behind gunicorn (Uvicorn workers); runs `alembic upgrade head` on boot |
| `worker` | Celery worker (KEV watch, EPSS changes, stale-cache refresh)               |
| `beat`   | Celery beat scheduler                                                     |
| `frontend`| nginx serving the built SPA + reverse proxy to the API                    |

### Environment variables

| Variable           | Default            | Description                                             |
|--------------------|--------------------|---------------------------------------------------------|
| `POSTGRES_DB`      | `cve_explorer`     | Database name                                           |
| `POSTGRES_USER`    | `postgres`         | Database user                                           |
| `POSTGRES_PASSWORD`| `postgres`         | **Change in production**                                |
| `LOG_LEVEL`        | `INFO`             | Backend log level                                       |
| `WEB_CONCURRENCY`  | `2`                | Gunicorn worker processes                               |
| `FRONTEND_PORT`    | `8080`             | Host port for the web app                               |
| `CORS_ORIGINS`     | `http://localhost:8080` | Comma-separated allowed origins                   |
| `NVD_API_KEY`      | *(empty)*          | NVD v2 API key — raises the limit from ~5 to ~50 req/30s. **Strongly recommended** |
| `GITHUB_TOKEN`     | *(empty)*          | Optional — raises exploit search from 60 to 5000 req/hour  |
| `API_KEYS`         | *(empty)*          | Comma-separated keys protecting write endpoints. Empty = writes are public |
| `VITE_API_URL`     | *(empty)*          | Leave empty for same-origin; set to a public API URL for a separate origin |
| `VITE_API_KEY`     | *(empty)*          | Key the SPA sends; must match one of `API_KEYS`          |
| `RETENTION_DAYS`   | `14`               | Days of `pg_dump` backups to retain                      |

## Securing write endpoints

Reads (lookup, batch, compare, analytics, alert listing) are always public. State-changing
endpoints can be protected with API keys — **do this before exposing the app to the internet**:

```bash
# Generate a key
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Put it in .env (both vars, so the SPA can authenticate)
API_KEYS=<generated-key>
VITE_API_KEY=<generated-key>
```

Protected: `POST /api/remediation/`, `PATCH /api/remediation/{id}`,
`PATCH /api/alerts/{id}/read`, `POST /api/alerts/read-all`, `PATCH /api/alerts/{id}/acknowledge`.

Clients may authenticate with either header:

```
X-API-Key: <key>
Authorization: Bearer <key>
```

Responses: `401` when the key is missing, `403` when it is wrong. Leaving `API_KEYS` empty
disables auth entirely (fine for a local or trusted-network deployment).

## Backups

`backend/scripts/backup_db.sh` writes a compressed, timestamped `pg_dump` to the `pgbackups`
volume (mounted at `/backups` in the backend container) and prunes dumps older than
`RETENTION_DAYS`.

```bash
# One-off backup
docker compose exec backend sh scripts/backup_db.sh

# Nightly at 03:15 via host cron
15 3 * * * cd /srv/cve-explorer && docker compose exec -T backend sh scripts/backup_db.sh >> /var/log/cve-backup.log 2>&1

# Restore (destructive)
docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < dump.sql
```

## Local development

### Option A — Docker with hot reload

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

- Frontend (Vite dev server): http://localhost:5173
- Backend (auto-reload): http://localhost:8000

### Option B — Manual

**Backend:**
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # defaults to SQLite — flip to PostgreSQL for prod parity
alembic upgrade head          # apply schema migrations
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
npm install
npm run dev                   # Vite proxies /api -> http://localhost:8000
```

## Database migrations

Schema is managed with Alembic. The baseline migration creates the full schema (including the EPSS `previous_score` column used for trend tracking).

```bash
# In backend/, with DATABASE_URL set (env var wins over alembic.ini)
alembic upgrade head          # apply
alembic revision --autogenerate -m "describe change"   # create a new migration
```

The production entrypoint runs `alembic upgrade head` automatically before starting the API.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cve/{id}` | Full CVE lookup with enrichment + risk |
| GET | `/api/cve/{id}/enrichments` | EPSS, KEV, exploit data |
| POST | `/api/cve/batch` | Batch lookup (up to 20 CVEs), consolidated risk summary |
| POST | `/api/cve/compare` | Side-by-side comparison (up to 3 CVEs) |
| GET | `/api/remediation/{cve_id}` | Remediation records |
| POST | `/api/remediation/` | Create record 🔒 |
| PATCH | `/api/remediation/{id}` | Update status 🔒 |
| GET | `/api/alerts/` | List alerts |
| GET | `/api/alerts/unread-count` | Unread count |
| PATCH | `/api/alerts/{id}/read` | Mark alert read 🔒 |
| POST | `/api/alerts/read-all` | Mark all read 🔒 |
| PATCH | `/api/alerts/{id}/acknowledge` | Acknowledge alert 🔒 |
| GET | `/api/analytics/dashboard` | Dashboard stats |
| GET | `/api/health` | Health check (DB-aware) |

🔒 = requires an API key when `API_KEYS` is set. Malformed CVE IDs are rejected with `422`
before any upstream call, and lookups are rate-limited (`20/minute` by default).

## Features

- **Multi-source CVE intelligence** (NVD, CIRCL, EPSS, CISA KEV, GitHub exploits)
- **Explainable risk scoring** (P1–P4) with per-signal factor breakdown, CVSS v4.0, EPSS trend arrows, and custom weight overrides
- **Exploitation guides** — 35 vulnerability-class templates with confidence-scored classification, detection/exploitation/mitigation steps, MITRE ATT&CK mapping, and live PoC integration
- **Batch CVE analysis** — paste or upload a list of CVEs, get a sortable/filterable risk dashboard
- **CVE comparison** — side-by-side risk, CVSS, EPSS, and KEV comparison for up to 3 CVEs
- **Remediation lifecycle** tracking (Open → Closed)
- **Alerting** for KEV additions and EPSS spikes
- **Analytics dashboard** with severity/risk distributions
- **Production hardening** — env-driven config, structured logging with request IDs, rate limiting (SlowAPI), gunicorn/Uvicorn workers, DB-aware health checks, Alembic migrations, optional API-key auth, upstream retry with `Retry-After` backoff, non-root containers, and scripted backups

## Development commands

```bash
npm test          # Run frontend tests
npm run lint      # Check code quality (ESLint)
npm run build     # Production build
```

## Go-live checklist

Run through this on the target host before opening the app to users:

- [ ] `cp .env.example .env`, then set `POSTGRES_PASSWORD`, `NVD_API_KEY`, and — if internet-facing — `API_KEYS` + `VITE_API_KEY`
- [ ] Set `CORS_ORIGINS` to your real origin (e.g. `https://cve.example.com`)
- [ ] `docker compose up -d --build`, then `docker compose ps` — every service should be `healthy`
- [ ] `curl http://localhost:8080/api/health` returns `{"status":"ok"...}` (503 means the DB is unreachable)
- [ ] Confirm migrations ran: `docker compose logs backend | grep -i alembic`
- [ ] Confirm workers are consuming: `docker compose logs worker | grep -i ready`
- [ ] Trigger a task once: `docker compose exec worker celery -A app.workers.celery_app call workers.check_new_kev`
- [ ] Smoke a real lookup and a batch of ~10 CVEs; watch for `429`/`403` in backend logs (means the NVD key is missing or throttled)
- [ ] Terminate TLS in front of the app (nginx TLS, Caddy, or a cloud load balancer) — the stack serves plain HTTP on `FRONTEND_PORT`
- [ ] Restrict host firewall to the reverse-proxy port only
- [ ] Schedule `backup_db.sh` via cron and verify one restore into a scratch database
- [ ] Push the repo so GitHub Actions CI runs (frontend lint/test/build + backend import against PostgreSQL)

## Tech Stack

- **Frontend:** React 19 + Vite + Tailwind CSS, served by nginx
- **Backend:** FastAPI + Python 3.12 (gunicorn + Uvicorn)
- **Database:** PostgreSQL 16 (SQLite for local dev), Alembic migrations
- **Cache/Broker:** Redis 7
- **Workers:** Celery
- **Deployment:** Docker Compose, GitHub Actions CI