# Requirements

- [Node](https://nodejs.org/) v22+
- [Yarn](https://classic.yarnpkg.com/) v1 ("classic")

# Terminology

- `webapp` - Live, interactive website that provides access to all reports.
- `report` - Info about a particular project/publication/whatever, _either_ as a webapp _page_ or a printed _PDF_.

# Repo Content

- `/app` - Live dashboard webapp made with Vue.
  Also used for rendering PDF reports.
- `/data` - All other functionality involving ingesting, transforming, and storing data.
  - `/api` - Types and functions for getting raw, as-is data from third-party APIs.
  - `/database` - Types, schemas, and functions for getting/setting data in the database.
    And the raw database itself†.
  - `/ingest` - Functions for scraping or requesting data from webpages or APIs and transforming it into a common db format.
  - `/report` - Functions specific to making reports, e.g. printing, collating.
  - `/util` - Small-scope general purpose functions.

† For now, the database is a **public** SQLite database stored in this repo.
The method of storing secret information is to-be-determined.

# Pipeline

The automated steps in this repo are generally as follows:

1. "Ingest"
   1. Gather funding opportunity numbers (and related metadata) from NIH public documents.
   1. Transform and pare down opportunity info into a common format.
   1. Add transformed info to the database.
   1. Repeat previous steps in order of dependency (e.g. opportunity number -> grant numbers) to get all needed info.
1. "Collate"
   1. Pick out high-level info from database in format best for reports.
1. "Print"
   1. Run webapp to render each _page_ report to _PDF_ report.
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
