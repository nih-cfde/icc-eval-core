/**
 * auto-generated typescript types for reporter API
 *
 * 1. run script below in browser dev tools
 * 2. run result through https://app.quicktype.io/?l=ts
 */

// fetch("https://api.reporter.nih.gov/v2/publications/search", {
//   method: "POST",
//   headers: { "Accept": "application/json", "Content-Type": "application/json" },
//   body: JSON.stringify({ criteria: {}, limit: 500 }),
// })
//   .then((r) => r.json())
//   .then(console.log);

export type PublicationsResults = {
  meta: Meta;
  results: Result[];
  facet_results: unknown[];
};

export type Meta = {
  search_id?: null;
  total?: number;
  offset?: number;
  limit?: number;
  sort_field?: string;
  sort_order?: string;
  sorted_by_relevance?: boolean;
  properties?: Properties;
};

export type Properties = Record<PropertyKey, unknown>;

export type Result = {
  coreproject?: string;
  pmid?: number;
  applid?: number;
};
