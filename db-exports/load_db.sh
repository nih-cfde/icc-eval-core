#!/usr/bin/env bash

TARGET_DUMPFILE="${1?"Error: No dump file specified"}"

# drop the database before restoring it to ensure a clean slate
psql -U "${POSTGRES_USER}" -d postgres -c "DROP DATABASE IF EXISTS ${POSTGRES_DB};" \
	&& echo "* Dropped existing database ${POSTGRES_DB}"

# recreate it empty
psql -U "${POSTGRES_USER}" -d postgres -c "CREATE DATABASE ${POSTGRES_DB};" \
	&& echo "* Created new database ${POSTGRES_DB}"

time pg_restore -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -Fc "${TARGET_DUMPFILE}" \
    && echo "* Loaded db export ${TARGET_DUMPFILE}" \
    || echo "* Failed to load db export (code: $?)"
