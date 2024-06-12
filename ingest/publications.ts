import { queryIcite } from "@/api/icite";
import { queryReporter } from "@/api/reporter";
import type { PublicationsQuery } from "@/api/reporter-publications-query.d";
import type { PublicationsResults } from "@/api/reporter-publications-results.d";
import type { Publication } from "@/database/publications";
import { diskLog, log, newline } from "@/util/log";

/** get publications associated with grant projects */
export const getPublications = async (
  coreProjects: string[],
): Promise<Publication[]> => {
  log("info", "Getting publications");

  /** get publications associated with grant projects */
  const { results } = await queryReporter<
    PublicationsQuery,
    PublicationsResults
  >("publications", { criteria: { core_project_nums: coreProjects } });

  log(
    results.length ? "success" : "error",
    `Found ${results.length.toLocaleString()} publications`,
  );
  newline();

  log("info", "Getting publication citation data");

  /** get extra info about publications */
  const { data } = await queryIcite(
    results.map((result) => result.pmid).filter((id): id is number => !!id),
  );

  log(
    data.length ? "success" : "error",
    `Found ${data.length.toLocaleString()} publication metadata`,
  );
  newline();

  diskLog(results, "results");
  diskLog(data, "data");

  /** validate */
  if (results.length !== data.length)
    log("error", "Number of RePORTER and iCite pubs don't match");

  return results.map((result) => ({
    id: result.pmid ?? 0,
    core_project: result.coreproject ?? "",
    application: result.applid ?? 0,
  }));
};
