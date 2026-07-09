# Common Fund Data Ecosystem (CFDE) Integration and Coordination Center (ICC) Evaluation Core

## Background

See https://nih-cfde.github.io/icc-eval-coordination/

## Contents

- `/frontend`: A dashboard written in Vue that shows basic metrics about the CFDE ecosystem. It uses a backend API to display its data.
- `/data`: A pipeline written in TypeScript that gathers information from various sources, exports them as JSON, which then get imported into the backend database.
- `/backend`: A REST API written in Python using Django that provides programmatic access to all of the information gathered by the pipeline.
- `/services`: Configuration files for other services needed to run the stack.

## Run the application

Install Docker and Docker Compose: https://docs.docker.com/get-docker/

Launch the backend, frontend, and other required services in a Docker environment:

```bash
./run_stack.sh
```

Once everything has launched, access the services at:

- Frontend: http://127.0.0.1:5175
- Backend API: http://127.0.0.1:8015/api/
- Backend Admin UI: http://127.0.0.1:8015/admin/

## Run the pipeline

Run the main info gathering pipeline, outside of the container:

```bash
./run_pipeline.sh --gather
```

Run the main info gathering pipeline, inside the container:

```bash
./run_stack.sh --profile pipeline run --rm -it pipeline
```

The pipeline should output JSON files under `/data/output` and `/data/raw`.

### Import info into backend

Import the results of the pipeline into the backend database (runs `import_dataset` inside the backend container):

```bash
./run_stack.sh run --rm -it backend uv run /app/icc_eval_core_api/manage.py import_dataset /data/output/
```
