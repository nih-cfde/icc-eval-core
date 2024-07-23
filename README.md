# CFDE ICC Evaluation Core

## Overview

The [Common Fund Data Ecosystem (CFDE)](https://commonfund.nih.gov/dataecosystem) is an effort to bring together knowledge across [Common Fund](https://commonfund.nih.gov/) programs into a cohesive resource.
The Integration and Coordination Center (ICC) is a center within the CFDE responsible for, among other things, reporting on the impact and influence of the CFDE.

This repository is a place to:

- View a high-level dashboard of Common Fund and CFDE activities (e.g. projects over time, dollars awarded, # of publications produced, etc.).
- Ensure your project is fully included in the dashboard by aligning with our ingest process.
- Maintain code used to coordinate the above.

You can view the information as a live webapp dashboard or as separate PDF reports.

[🖱️ The Dashboard Webapp](cfde-eval.netlify.app)

[📜 PDF Reports](cfde-eval.netlify.app/reports)

## Submit your project

We gather most details about Common Fund projects automatically from NIH resources, but there are some pieces of info that require manual actions to be integrated.
If you would like your project to be included in the dashboard to the fullest extent, please follow the instructions in the sections below as applicable.

### Submit software repositories

Repositories ("repos") are places for storing, tracking changes to, and collaborating on software.

Currently, we only take submissions of software kept in _public_ GitHub.com repos.
Private repos and other platforms such as GitLab aren't supported yet.

1. Find all GitHub repos that are associated with your project.
   1. If you're unsure where to find these, ask members of your project about any software that was written in support of it, and where the code for the software resides.
1. "Tag" each repo with the project.
   1. See [GitHub's instructions for tagging repos](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics) for reference.
   1. On the main page of the repo, click on the gear ⚙ next to "About".
   1. Under "Topics", type in your _core project number_†, e.g. `U54OD036472` (case-insensitive).

[This repository itself](https://github.com/nih-cfde/icc-eval-core) has been [tagged with its core project number](https://github.com/topics/u54od036472), so use it as a reference.

† Do not confuse this with a (sub) "project" number, which is longer, e.g. `1U54OD036472-01`.

---

# Development

## Requirements

- [Node](https://nodejs.org/) v22+
- [Yarn](https://classic.yarnpkg.com/) v1 ("classic")

## Pipeline

The automated steps in this repo are roughly as follows:

1. _Ingest_
   1. Get _raw_ data from an external resource, either by scraping an HTML page, downloading and parsing a PDF or CSV, or making a request to an API.
   1. Save _raw_ data exactly as-is for provenance and caching.
   1. Collate most important information from _raw_ data into common high-level _output_ data format suited to making desired dashboard _pages_ and PDF _reports_.
   1. Repeat previous steps in order of dependency (e.g. opportunity number -> grant numbers) until all needed info is gathered.
1. _Print_
   1. Run dashboard webapp.
   1. Import _output_ data from _ingest_, and do some minimal final processing (e.g. combine journal info with each publication listing).
   1. Render select dashboard _pages_ (e.g. `/core-project/abc123`) to PDF _reports_.
1. Deploy dashboard and PDFs to live, public web addresses.

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
- Playwright - Tool used for scraping public web pages and rendering dashboard _pages_ to PDF _reports_.
- Netlify - Service used for hosting dashboard webapp (and PR previews).
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
