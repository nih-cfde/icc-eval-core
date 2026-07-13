#!/bin/bash

# run collectstatic
uv run python manage.py collectstatic --noinput

# run migrations
uv run python manage.py migrate

# ensure the superuser exists, creating it if not
# (uses the .env file for the username, email, and password)
uv run python manage.py createsuperuser \
	--noinput || true

# run the server
if [[ "${DJANGO_DEBUG:-0}" = "1" ]]; then
	uv run python manage.py runserver 0.0.0.0:8000
else
	uv run gunicorn icc_eval_core_api.asgi:application \
		-k uvicorn_worker.UvicornWorker \
		--workers ${WEB_WORKERS:-4} \
		--bind 0.0.0.0:8000
fi
