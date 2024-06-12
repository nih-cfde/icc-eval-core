import { queryIcite } from "@/api/icite";
import { queryReporter } from "@/api/reporter";
import type { PublicationsQuery } from "@/api/reporter-publications-query.d";
import type { PublicationsResults } from "@/api/reporter-publications-results.d";
import type { Publication } from "@/database/publications";
import { log, newline } from "@/util/log";

/** temporary shim, node v22 types (with new Set functions) not out yet */
declare global {
  // eslint-disable-next-line
  interface Set<T> {
    difference: (set: Set<T>) => Set<T>;
  }
}

/** get publications associated with grant projects */
export const getPublications = async (
  coreProjects: string[],
): Promise<Publication[]> => {
  log("info", "Getting publications");

  /** get publications associated with grant projects */
  const { results: reporterResults } = await queryReporter<
    PublicationsQuery,
    PublicationsResults
  >("publications", { criteria: { core_project_nums: coreProjects } });
  const reporterSet = new Set(reporterResults.map((result) => result.pmid));

  log(
    reporterResults.length ? "success" : "error",
    `Found ${reporterSet.size.toLocaleString()} unique (${reporterResults.length.toLocaleString()} total) publications`,
  );
  newline();

  log("info", "Getting publication citation data");

  /** get extra info about publications */
  const { data: iciteResults } = await queryIcite(
    reporterResults
      .map((result) => result.pmid)
      .filter((id): id is number => !!id),
  );
  const iciteSet = new Set(iciteResults.map((result) => result.pmid));

  log(
    iciteResults.length ? "success" : "error",
    `Found ${iciteResults.length.toLocaleString()} unique (${iciteSet.size.toLocaleString()} total) publication metadata`,
  );

  /** validate */
  const notInIcite = reporterSet.difference(iciteSet);
  const notInReporter = iciteSet.difference(reporterSet);
  if (
    reporterSet.size !== iciteSet.size ||
    notInIcite.size ||
    notInReporter.size
  ) {
    log("secondary", `Not in iCite: ${notInIcite}`);
    log("secondary", `Not in RePORTER: ${notInReporter}`);
    log("error", "Number of RePORTER and iCite pubs don't match");
  }

  return reporterResults.map((result) => ({
    id: result.pmid ?? 0,
    core_project: result.coreproject ?? "",
    application: result.applid ?? 0,
  }));
};
