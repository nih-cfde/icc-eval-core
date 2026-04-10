#!/bin/bash

# set -e

# if [ "${SKIP_DB_LOAD}" = "1" ]; then
#     echo "* Skipping db import, since SKIP_DB_LOAD=${SKIP_DB_LOAD}"
# elif [ -d "/db-exports/" ]; then
#     # find the most recent database dump /db-exports/*.dump in by using sort;
#     # presumes that dumpfiles are named <label>_<timestamp>.dump
#     TARGET_DUMPFILE=$(ls /db-exports/*.dump | sort -t '_' -k2 -r | head -n 1)
    
#     echo "* Found db export ${TARGET_DUMPFILE}"

#     # drop and recreate the database
# 	echo "* Dropping and recreating database ${POSTGRES_DB}..."
#     dropdb -U ${POSTGRES_USER} ${POSTGRES_DB}
#     createdb -U ${POSTGRES_USER} -T template0 ${POSTGRES_DB}

# 	echo "* Restoring database from dump ${TARGET_DUMPFILE}..."
#     time pg_restore -U ${POSTGRES_USER} -d ${POSTGRES_DB} -j "$(nproc)" "${TARGET_DUMPFILE}"

#     echo "* Restored db export ${TARGET_DUMPFILE}"
# else    
#     echo "No db-exports directory found, skipping import"
# fi

# touch /tmp/initialized

set -euo pipefail

if [ "${SKIP_DB_LOAD:-0}" = "1" ]; then
  echo "* Skipping db import, since SKIP_DB_LOAD=${SKIP_DB_LOAD}"
  touch /tmp/initialized
  exit 0
fi

if [ ! -d "/db-exports/" ]; then
  echo "No db-exports directory found, skipping import"
  touch /tmp/initialized
  exit 0
fi

TARGET_DUMPFILE=$(ls /db-exports/*.dump | sort -t '_' -k2 -r | head -n 1)
echo "* Found db export ${TARGET_DUMPFILE}"

echo "* Dropping and recreating database ${POSTGRES_DB}..."
dropdb  -U "${POSTGRES_USER}" "${POSTGRES_DB}" || true
createdb -U "${POSTGRES_USER}" -T template0 "${POSTGRES_DB}"

echo "* Tuning Postgres for restore..."
psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -v ON_ERROR_STOP=1 <<'SQL'
ALTER SYSTEM SET max_wal_size = '16GB';
ALTER SYSTEM SET checkpoint_timeout = '30min';
ALTER SYSTEM SET checkpoint_completion_target = '0.9';
ALTER SYSTEM SET wal_compression = 'on';
ALTER SYSTEM SET synchronous_commit = 'off';
ALTER SYSTEM SET autovacuum = 'off';
SELECT pg_reload_conf();
SQL

echo "* Restoring database from dump ${TARGET_DUMPFILE}..."
time pg_restore -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -j "$(nproc)" "${TARGET_DUMPFILE}"

echo "* Re-enabling normal settings..."
psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -v ON_ERROR_STOP=1 <<'SQL'
ALTER SYSTEM RESET autovacuum;
ALTER SYSTEM RESET synchronous_commit;
-- keep wal/checkpoint settings if you like for dev; otherwise RESET them too.
SELECT pg_reload_conf();
SQL

touch /tmp/initialized
echo "* Restored db export ${TARGET_DUMPFILE}"
