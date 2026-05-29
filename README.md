# Common Fund Data Ecosystem (CFDE) ICC Evaluation Core Site

This repo contains implementations of the frontend and backend for the ICC Evaluation Core site, which provides a dashboard for tracking CFDE-affiliated projects.

The structure of the repo is as follows:
- `frontend/`: This is the React frontend for the ICC Evaluation Core site. It consumes the API provided by the backend and renders the dashboard UI.
- `data/`: This directory contains the data harvester pipeline implementation, which gathers data from various sources and writes them to `/data/output/` in a format that can be imported into the backend database.
- `backend/`: This is the Django REST Framework API backend for the ICC Evaluation Core site. It defines the data models, serializers, and API views for serving data to the frontend.
  - `icc_eval_core_api/api/`: Contains the actual implementation of the API, i.e. the views that the frontend consumes to render its dashboard.
  - `icc_eval_core_api/icc_eval_core_api/`: Contains Django configuration for the site.
- `services/`: Contains configuration for running services that are required by the app stack, but not implemented in this repo (e.g., postgresql, caddy)

## Running The App

First, you should have Docker and Docker Compose installed. To obtain docker, visit the following link: https://docs.docker.com/get-docker/

To launch the app, you can use the `run_stack.sh` helper script:

```bash
./run_stack.sh
```

This will launch the backend, frontend, and any required services in a Docker environment.

Once everything has launched, you can access the services at these URLs:
- Frontend: http://127.0.0.1:5173
- Backend API: http://127.0.0.1:8015/api/
- Backend Admin UI: http://127.0.0.1:8015/admin/

You can find the credentials for the admin UI in the `.env` file, as `DJANGO_SUPERUSER_USERNAME` and
`DJANGO_SUPERUSER_PASSWORD`.

(Note that you must access the frontend from `127.0.0.1` and not `localhost` due to ORCID, our OAuth provider, only whitelisting `127.0.0.1` explicitly.)

## Running the Pipeline

To run the pipeline on the host, you can use the `run_pipeline.sh` helper script:

```bash
./run_pipeline.sh --gather
```

To run it in a container, you can use the following command:

```bash
./run_stack.sh --profile pipeline run --rm -it pipeline
```

In both cases, once the pipeline completes you'll find the resulting output under `./data/output/`.

### Importing Pipeline Results into Backend

To import the results of the pipeline into the backend, you'll run the `import_dataset` command from within
the backend container, which allows it to write to the database. You can do this with the following command:

```bash
./run_stack.sh run --rm -it backend uv run /app/icc_eval_core_api/manage.py import_dataset /data/output/
```
