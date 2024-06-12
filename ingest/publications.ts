import { queryReporter } from "./reporter";
import type { PublicationsQuery } from "./reporter-publications-query.d";
import type { PublicationsResults } from "./reporter-publications-results.d";

/** get publications associated with grant projects */
export const getPublications = async (coreProjects: string[]) => {
  const { results } = await queryReporter<
    PublicationsQuery,
    PublicationsResults
  >("publications", { criteria: { core_project_nums: coreProjects } });

  return results;
};
