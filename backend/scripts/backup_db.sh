#!/usr/bin/env sh
#
# Postgres backup for CVE Explorer.
#
# Creates a compressed, timestamped pg_dump and prunes dumps older than
# RETENTION_DAYS. Designed to run inside the backend container.
#
# Usage (from host):
#   docker compose exec backend sh scripts/backup_db.sh
#
# Or via cron on the host (daily 03:15, keep 14 days):
#   15 3 * * * cd /path/to/cve-explorer && docker compose exec -T backend sh scripts/backup_db.sh >> /var/log/cve-backup.log 2>&1
#
set -eu

POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-cve_explorer}"
POSTGRES_HOST="${POSTGRES_HOST:-db}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

export PGPASSWORD="${POSTGRES_PASSWORD}"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
outfile="${BACKUP_DIR}/cve_explorer_${timestamp}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[backup] dumping ${POSTGRES_DB} -> ${outfile}"
pg_dump \
  --host="$POSTGRES_HOST" \
  --port="$POSTGRES_PORT" \
  --username="$POSTGRES_USER" \
  --dbname="$POSTGRES_DB" \
  --no-owner \
  --no-privileges \
  | gzip -9 > "$outfile"

# Fail loudly if the dump is suspiciously small (empty/failed dump).
size="$(wc -c < "$outfile")"
if [ "$size" -lt 1024 ]; then
  echo "[backup] ERROR: dump is only ${size} bytes — treating as failure" >&2
  rm -f "$outfile"
  exit 1
fi

echo "[backup] wrote ${outfile} (${size} bytes)"

echo "[backup] pruning dumps older than ${RETENTION_DAYS} day(s)"
find "$BACKUP_DIR" -name 'cve_explorer_*.sql.gz' -type f -mtime "+${RETENTION_DAYS}" -print -delete || true

echo "[backup] done"

# Restore reference (destructive — recreates schema):
#   gunzip -c cve_explorer_YYYYmmddTHHMMSSZ.sql.gz | \
#     PGPASSWORD=... psql --username=postgres --host=db --dbname=cve_explorer
