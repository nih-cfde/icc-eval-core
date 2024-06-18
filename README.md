# Requirements

- Node v22+
- Yarn v1 ("classic")

# Repo Content

- `/app` - Live dashboard webapp made with Vue.
  Also used for rendering PDF reports.
- `/data` - All other functionality involving ingesting, transforming, and storing data for the webapp and reports.
  - `/api` - Types and functions for getting raw, as-is data from third-party APIs.
  - `/database` - Types, schemas, and functions for getting/setting data in the database.
    And the raw SQLite database itself.
  - `/ingest` - Functions for scraping or requesting data from webpages or APIs and transforming it into a common db format.
  - `/report` - Functions for collating and generating reports.
  - `/util` - Small-scope general purpose functions.

# Process

The general process of compiling the data is as follows:

1. Gather funding opportunity numbers (and related metadata) from NIH public documents.
1. Transform and pare down that opportunity info into a common format.
1. Add that transformed info to the database†.
1. Get the next level of info dependent on that info (e.g. opportunity number -> grant numbers, grant numbers -> publication numbers) and repeat the previous steps.
1. Pick out and collate high-level data from database.
1. Run webapp to display and format data and print to PDF reports.
1. Live webapp and PDF reports deploy publicly automatically.

† For now, the database is a **public** SQLite database stored in this repo.
The method of storing secret information is to-be-determined.
