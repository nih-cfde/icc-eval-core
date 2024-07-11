## Requirements

- [Node](https://nodejs.org/) v22+
- [Yarn](https://classic.yarnpkg.com/) v1 ("classic")

## Pipeline

The automated steps in this repo are roughly as follows:

1. _Ingest_
   1. Get _raw_ data from an external resource, either by scraping an HTML page, downloading and parsing a PDF or CSV, or making a request to an API.
   1. Save _raw_ data exactly as-is for provenance and caching.
   1. Collate most important information from _raw_ data into common high-level _output_ data format suited to making desired reports.
   1. Repeat previous steps in order of dependency (e.g. opportunity number -> grant numbers) until all needed info is gathered.
1. _Print_
   1. Run webapp (interactive dashboard that provides access to all reports).
   1. Import _output_ data from _ingest_, and do some minimal final processing (e.g. combine journal info with each publication listing).
   1. Render select webapp _pages_ (e.g. `/core-project/abc123`) to PDF _reports_.
1. Deploy webapp and PDFs to live, public web addresses.

## Repo Content

- `/app` - Dashboard webapp made with Vue.
  Also used for generating PDF reports.
  - `/public/pdfs` - Outputted PDF reports.
- `/data` - All other functionality involving data (e.g. ingesting/collating/etc).
  - `/api` - Types and functions for getting raw data from external APIs.
  - `/raw` - Raw data gathered from external sources.
    Primarily for provenance, but also acts as ingest cache (delete files to re-fetch from external providers).
  - `/ingest` - Functions for scraping webpages and calling APIs, and collating that data into a common format.
  - `/output` - Collated data in format for making desired reports.
  - `/print` - Functions specific to making printed reports.
  - `/util` - Small-scope general purpose functions.

## Technology

- TypeScript - Language used to provide type-safety from beginning to end of pipeline.
- Playwright - Tool used for scraping public web pages and rendering webapp _page_ reports to PDFs.
- Netlify - Service used for hosting webapp (and PR previews).
- Octokit - Library used for conveniently interacting with GitHub APIs.

The ingest pipeline is optimized wherever possible and appropriate.
Things like network requests and rendering are parallelized (e.g. PDF reports are printed simultaneously in separate tabs of the same Playwright browser instance).
External resources are cached in their _raw_ format to speed up subsequent runs, and to avoid being rate-limited or blocked by those providers.

## Commands

Use `./run.sh` with flags to run specific steps or tasks in this repo:

| Flag        | Description                                                    |
| ----------- | -------------------------------------------------------------- |
| `--install` | Install packages and dependencies                              |
| `--ingest`  | Run "ingest" pipeline step                                     |
| `--print`   | Run "print" pipeline step                                      |
| no flag     | Run pipeline steps in order                                    |
| `--app`     | Run webapp in dev mode                                         |
| `--test`    | Run all tests (type-checking, linting/formatting checks, etc.) |
| `--lint`    | Auto-fix linting/formatting                                    |
