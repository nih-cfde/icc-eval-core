import { uniq, uniqBy } from "lodash-es";
import { queryIcite } from "@/api/icite";
import { queryReporter } from "@/api/reporter";
import type { Datum } from "@/api/types/icite-results";
import type { PublicationsQuery } from "@/api/types/reporter-publications-query";
import type { PublicationsResults } from "@/api/types/reporter-publications-results";
import { log } from "@/util/log";
import { query } from "@/util/request";
import { count, formatDate } from "@/util/string";

/** get publications associated with core projects */
export const getPublications = async (coreProjects: string[]) => {
  /** de-dupe */
  coreProjects = uniq(coreProjects);

  log(`Getting publications for ${count(coreProjects)} core projects`);

  /** get publications associated with core projects */
  const reporter = await query(
    () =>
      queryReporter<PublicationsQuery, PublicationsResults>("publications", {
        criteria: { core_project_nums: coreProjects },
      }),
    "reporter-publications.json",
  );

  /** extract results */
  let reporterPublications = reporter?.results ?? [];

  /** de-dupe */
  reporterPublications = uniqBy(reporterPublications, (result) => result.pmid);

  log(`Getting metadata for ${count(reporterPublications)} core publications`);

  /** get extra info about publications */
  const icite = await query(
    () =>
      queryIcite(
        reporterPublications
          .map((result) => result.pmid)
          .filter((id): id is number => !!id),
      ),
    "icite.json",
  );

  /** extract results */
  let icitePublications = icite?.data ?? [];

  /** de-dupe */
  icitePublications = uniqBy(icitePublications, (result) => result.pmid);

  /** quick lookup of extra info from icite results by id */
  const extrasLookup: Record<
    NonNullable<Datum["pmid"]>,
    Omit<Datum, "pmid">
  > = Object.fromEntries(
    icitePublications.map(({ pmid, ...rest }) => [pmid, rest]),
  );

  /** validate */
  const reporterSet = new Set(
    reporterPublications.map((result) => result.pmid),
  );
  const iciteSet = new Set(icitePublications.map((result) => result.pmid));
  const notInIcite = reporterSet.difference(iciteSet);
  const notInReporter = iciteSet.difference(reporterSet);
  if (
    reporterSet.size !== iciteSet.size ||
    notInIcite.size ||
    notInReporter.size
  ) {
    log(`Not in iCite: ${Array.from(notInIcite).join(", ")}`, "secondary");
    log(
      `Not in RePORTER: ${Array.from(notInReporter).join(", ")}`,
      "secondary",
    );
    log("Number of RePORTER and iCite pubs don't match", "error");
  }

  /** transform data into desired format, with fallbacks */
  const transformedPublications = reporterPublications.map((result) => {
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
      modified: formatDate(extras?.last_modified),
      doi: extras?.doi ?? "",
      relative_citation_ratio: extras?.relative_citation_ratio ?? 0,
      citations: extras?.citation_count ?? 0,
      citations_per_year: extras?.citations_per_year ?? 0,
    };
  });

  return transformedPublications;
};
