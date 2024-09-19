# CFDE ICC Evaluation Core

[![Pipeline](https://github.com/nih-cfde/icc-eval-core/actions/workflows/pipeline.yaml/badge.svg)](https://github.com/nih-cfde/icc-eval-core/actions/workflows/pipeline.yaml)

[![Tests](https://github.com/nih-cfde/icc-eval-core/actions/workflows/test.yaml/badge.svg)](https://github.com/nih-cfde/icc-eval-core/actions/workflows/test.yaml)

## Overview

The [Common Fund Data Ecosystem (CFDE)](https://commonfund.nih.gov/dataecosystem) is an effort to bring together knowledge across [Common Fund](https://commonfund.nih.gov/) programs into a cohesive resource.
The Integration and Coordination Center (ICC) is a center within the CFDE responsible for, among other things, reporting on the impact and influence of the CFDE.

This repository is a place to:

- View a high-level dashboard of Common Fund and CFDE activities (e.g. projects over time, dollars awarded, # of publications produced, etc.).
- Ensure your project is fully included in the dashboard by aligning with our ingest process.
- Maintain code used to coordinate the above.

You can view the information as a live dashboard webapp or as separate PDF reports.

[🖱️ The Dashboard Webapp](https://cfde-eval.netlify.app)

[📜 PDF Reports](https://cfde-eval.netlify.app/reports)

## Contact

Current maintainers and team members:

- [Casey Greene](mailto:casey.s.greene@cuanschutz.edu) - Evaluation Core Lead
- [Sean Davis](mailto:sean.2.davis@cuanschutz.edu) - Evaluation Core Lead
- [Vincent Rubinetti](mailto:vincent.rubinetti@cuanschutz.edu) ([@vincerubinetti](https://github.com/vincerubinetti)) - Software developer

## Submit your project

We gather most details about Common Fund projects automatically from NIH systems, but there are some pieces of info that require manual actions to be integrated.
If you would like your project to be included in the dashboard to the fullest extent, please follow the instructions in the sections below as applicable.
We've tried to make this process as easy and automated as possible.

Once you've made a submission (and once your project is in NIH systems), your project should appear here the next time our ingest process runs.
We try to run the ingest process regularly and frequently, but if you'd like your project to show up faster or are otherwise having issues, please [contact us](#contact).

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

### Submit analytics

Analytics are services that monitor traffic (number of visits over time, number of unique visitors, visitor demographics, etc.) on publicly accessible webpages.

Currently, we only take submissions of webpages using Google Analytics.
Other analytics services may supported in the future.

1. Find all Google Analytics properties that are associated with your project.
   1. If you're unsure where to find these, ask members of your project about any webpages related to it, and if anyone set up analytics for them.
1. Allow us access to each property.
   1. Go to the [Google Analytics dashboard](https://analytics.google.com/) and make sure you are [on the right property](https://support.google.com/analytics/answer/10252712?hl=en).
   1. Find "Property Access Management" from the main search bar (or the "Admin" side menu).
   1. Add a new user with the email `api-access@cfde-icc-eval-core-433116.iam.gserviceaccount.com`, uncheck "Notify by email", and select the "Viewer" role.
1. "Tag" each property so we can associate it with a particular project.
   1. Find "Key Events" from the "Admin" side menu,under "Data Display".
   1. Create a new key event with the name `cfde_XXX` (case-insensitive), where XXX is the _core_ project number, e.g. `cfde_R03OD034502`.

---

# Development

## Requirements

- Linux or MacOS system
- [Node](https://nodejs.org/) v22+
- [Bun](https://bun.sh/) (_for package management only_, as faster/smaller replacement for Yarn)

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

## Repo content

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

The pipeline is optimized wherever possible and appropriate.
Things like network requests and rendering are parallelized (e.g. PDF reports are printed simultaneously in separate tabs of the same Playwright browser instance).
External resources are cached in their _raw_ format to speed up subsequent runs, and to avoid being rate-limited or blocked by those providers.

## Commands

Use `./run.sh` with a `--flag` to conveniently run a `script` of the same name in `/data/package.json` and `/app/package.json` (if it exists) from the root of this repo.

Most important scripts:

| Flag                   | Description                                                    |
| ---------------------- | -------------------------------------------------------------- |
| `--install`            | Install packages and dependencies                              |
| `--install-playwright` | Install Playwright                                             |
| _no flag_              | Run main pipeline steps in order                               |
| `--test`               | Run all tests (type-checking, linting/formatting checks, etc.) |
| `--lint`               | Auto-fix linting/formatting                                    |
| `--dev`                | Run dashboard webapp in dev mode                               |

See readmes in sub folders for all commands.

## Environment variables

- `CACHE` - Whether to use cached files in `/raw` to skip time-consuming network requests.
  Set to `true` (or any string) for true.
  Leave blank/unset for false.
  `false` by default.
