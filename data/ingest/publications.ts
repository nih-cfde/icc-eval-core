import { uniq, uniqBy } from "lodash-es";
import { queryIcite } from "@/api/icite";
import type { Datum } from "@/api/icite-results";
import { queryReporter } from "@/api/reporter";
import type { PublicationsQuery } from "@/api/reporter-publications-query.d";
import type { PublicationsResults } from "@/api/reporter-publications-results.d";
import { saveJson } from "@/util/file";
import { log } from "@/util/log";

const { RAW_PATH } = process.env;

/** get publications associated with core projects */
export const getPublications = async (coreProjects: string[]) => {
  /** de-dupe */
  coreProjects = uniq(coreProjects);

  log(
    `Getting publications for ${coreProjects.length.toLocaleString()} core projects`,
    "start",
  );

  /** get publications associated with core projects */
  let { results: reporterResults } = await queryReporter<
    PublicationsQuery,
    PublicationsResults
  >("publications", { criteria: { core_project_nums: coreProjects } });

  saveJson(reporterResults, RAW_PATH, "publications-reporter");

  /** de-dupe */
  reporterResults = uniqBy(reporterResults, (result) => result.pmid);

  log(
    `Found ${reporterResults.length.toLocaleString()} publications`,
    reporterResults.length ? "success" : "error",
  );

  /** get extra info about publications */
  let { data: iciteResults } = await queryIcite(
    reporterResults
      .map((result) => result.pmid)
      .filter((id): id is number => !!id),
  );

  saveJson(reporterResults, RAW_PATH, "publications-icite");

  /** de-dupe */
  iciteResults = uniqBy(iciteResults, (result) => result.pmid);

  log(
    `Found ${iciteResults.length.toLocaleString()} publication metadata`,
    iciteResults.length ? "success" : "error",
  );

  /** quick lookup of extra info from icite results by id */
  const extrasLookup: Record<
    NonNullable<Datum["pmid"]>,
    Omit<Datum, "pmid">
  > = Object.fromEntries(iciteResults.map(({ pmid, ...rest }) => [pmid, rest]));

  /** validate */
  const reporterSet = new Set(reporterResults.map((result) => result.pmid));
  const iciteSet = new Set(iciteResults.map((result) => result.pmid));
  const notInIcite = reporterSet.difference(iciteSet);
  const notInReporter = iciteSet.difference(reporterSet);
  if (
    reporterSet.size !== iciteSet.size ||
    notInIcite.size ||
    notInReporter.size
  ) {
    log(`Not in iCite: ${notInIcite}`, "secondary");
    log(`Not in RePORTER: ${notInReporter}`, "secondary");
    log("Number of RePORTER and iCite pubs don't match", "error");
  }

  /** transform data into desired format, with fallbacks */
  const transformedPublications = reporterResults.map((result) => {
    const extras = extrasLookup[result.pmid ?? 0];
    return {
      id: result.pmid ?? 0,
      core_project: result.coreproject ?? "",
      application: result.applid ?? 0,
      title: extras?.title ?? "",
      authors: (extras?.authors ?? "")
        .split(",")
        .map((string) => string.trim()),
      journal: extras?.journal ?? "",
      year: extras?.year ?? 0,
      modified: extras?.last_modified
        ? new Date(extras.last_modified).toISOString()
        : "",
      doi: extras?.doi ?? "",
      relative_citation_ratio: extras?.relative_citation_ratio ?? 0,
      citations: extras?.citation_count ?? 0,
      citations_per_year: extras?.citations_per_year ?? 0,
    };
  });

  return transformedPublications;
};
