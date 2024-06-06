import { queryReporter } from "./reporter";

/** get grant projects associated with funding opportunities */
export const getProjects = (opportunities: string[]) =>
  queryReporter({ criteria: { opportunity_numbers: opportunities } });
