# Common Fund Data Ecosystem (CFDE) Integration and Coordination Center (ICC) Evaluation Core

## Background

The Common Fund Data Ecosystem (CFDE) is an effort to bring together knowledge across NIH Common Fund programs into a cohesive resource.

We are the Integration and Coordination Center (ICC), a center within the CFDE.
We are responsible for (among other things) gathering info associated with Common Fund projects and sharing it with the NIH.
We also aim to make already-public info more accessible by presenting it in a centralized way.

See https://nih-cfde.github.io/icc-eval-coordination/ for more context.

## Contents

- `/frontend`: A dashboard written in Vue that shows basic metrics about CFDE ecosystem. Uses backend API to display its data.
- `/data`: A pipeline written in TypeScript that gathers information from various sources and exports them as JSON files which then get imported into backend database.
- `/backend`: A REST API written in Python using Django that provides programmatic access to all of information gathered by pipeline. Private info only viewable by authorized users via ORCID authentication.
- `/services`: Configuration files for other services needed to run stack.

## Run application

Install Docker and Docker Compose: https://docs.docker.com/get-docker/

Launch backend, frontend, and other required services in a Docker environment:

```bash
./run_stack.sh
```

Once everything has launched, access services at:

- Frontend: http://127.0.0.1:5175
- Backend API: http://127.0.0.1:8015/api/
- Backend Admin UI: http://127.0.0.1:8015/admin/

## Run pipeline

Run main info gathering pipeline, outside of container:

```bash
./run_bun.sh --gather
```

Run main info gathering pipeline, inside container:

```bash
./run_stack.sh --profile pipeline run --rm -it pipeline
```

Pipeline should output JSON files under `/data/output` and `/data/raw`.

### Import info into backend

Import results of pipeline into backend database (runs `import_dataset` inside backend container):

```bash
./run_stack.sh run --rm -it backend uv run /app/icc_eval_core_api/manage.py import_dataset /data/output/
```
