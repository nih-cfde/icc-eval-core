# CFDE ICC Evaluation Core

[![Run pipeline](https://github.com/nih-cfde/icc-eval-core/actions/workflows/pipeline.yaml/badge.svg)](https://github.com/nih-cfde/icc-eval-core/actions/workflows/pipeline.yaml)
[![Run tests](https://github.com/nih-cfde/icc-eval-core/actions/workflows/test.yaml/badge.svg)](https://github.com/nih-cfde/icc-eval-core/actions/workflows/test.yaml)

## Overview

This repo supports the activities described in [this repo](https://github.com/nih-cfde/icc-eval-coordination?tab=readme-ov-file).

# Development

## Requirements

- Linux or MacOS system
- [Node](https://nodejs.org/) v22+
- [Bun](https://bun.sh/) (_for package management only_, as faster/smaller replacement for Yarn)

## Pipeline

The automated steps in this repo are roughly as follows:

1. _Gather_
   1. Get _raw_ data from an external resource, e.g. scraping an HTML page, downloading/parsing a PDF/CSV, making a request to an API, etc.
   1. Save _raw_ data exactly as-is for provenance and caching.
   1. Collate most important information from _raw_ data into common high-level _output_ data format suited to making desired dashboard _pages_ and PDF _reports_.
   1. Repeat previous steps in order of dependency (e.g. opportunity number -> grant numbers) until all needed info is gathered.
1. _Print_
   1. Run dashboard webapp.
   1. Import _output_ data from _gather_ step, and do some minimal final processing (e.g. combine journal info with each publication listing).
   1. Render select dashboard _pages_ (e.g. `/core-project/abc123`) to PDF _reports_.
1. Deploy dashboard and PDFs to private web addresses.

## Repo content

- `/app` - Dashboard webapp made with Vue.
  Also used for generating PDF reports.
  - `/public/pdfs` - Outputted PDF reports.
- `/data` - All other functionality involving data.
  - `/api` - Types and functions for getting raw data from external APIs.
  - `/raw` - Raw data gathered from external sources, for provenance.
  - `/gather` - Functions for gathering data and putting it in a common format.
  - `/output` - Gathered data in format for making desired reports.
  - `/print` - Functions specific to making printed reports.
  - `/util` - Small-scope general purpose functions.

## Technology

- TypeScript - Language used to provide type-safety from beginning to end of pipeline.
- Playwright - Tool used for scraping public web pages and rendering dashboard _pages_ to PDF _reports_.
- Netlify - Service used for privately hosting dashboard webapp (and PR previews).

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

- `CACHE` - Whether to use cached responses (stored in `/raw/cache.json`) to skip time-consuming network requests.
  Set to `true` (or any string) for true.
  Leave blank/unset for false.
  `false` by default.
