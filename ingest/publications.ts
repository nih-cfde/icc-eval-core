import { queryReporter } from "@/api/reporter";
import type { PublicationsQuery } from "@/api/reporter-publications-query.d";
import type { PublicationsResults } from "@/api/reporter-publications-results.d";
import type { Publication } from "@/database/publications";

/** get publications associated with grant projects */
export const getPublications = async (
  coreProjects: string[],
): Promise<Publication[]> => {
  const { results } = await queryReporter<
    PublicationsQuery,
    PublicationsResults
  >("publications", { criteria: { core_project_nums: coreProjects } });

  return results.map((result) => ({
    id: result.pmid ?? 0,
    core_project: result.coreproject ?? "",
    application: result.applid ?? 0,
  }));
};
