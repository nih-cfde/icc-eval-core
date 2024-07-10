# Requirements

- [Node](https://nodejs.org/) v22+
- [Yarn](https://classic.yarnpkg.com/) v1 ("classic")

# Terminology

- `webapp` - Live, interactive website that provides access to all reports.
- `report` - Info about a particular project/publication/whatever, _either_ as a webapp _page_ or a printed _PDF_.

# Repo Content

- `/app` - Live dashboard webapp made with Vue.
  Also used for rendering PDF reports.
- `/data` - All other functionality involving data, e.g. ingesting/collating/etc.
  - `/api` - Types and functions for getting raw data from third-party APIs.
  - `/raw` - Raw data gathered from third-party sources (for provenance and caching).
  - `/ingest` - Functions for scraping webpages and calling APIs, and collating that data into a common format.
  - `/output` - Collated data.
  - `/print` - Functions specific to making printed reports.
  - `/util` - Small-scope general purpose functions.

# Pipeline

The automated steps in this repo are generally as follows:

1. Gather funding opportunity numbers (and related metadata) from NIH public documents.
1. Collate opportunity data into a common format.
1. Repeat previous steps in order of dependency (e.g. opportunity number -> grant numbers) to get all needed info.
1. Run webapp, which imports collated data, to render each _page_ report to _PDF_ report.
1. Live webapp and PDFs deploy publicly automatically.

## Commands

Use `run.sh` to conveniently run multiple commands across subdirectories.
Examples:

```shell
# install all dependencies
./run.sh --install-all

# run pipeline
./run.sh

# run tests
./run.sh --test
```

See script source for all available flags.
