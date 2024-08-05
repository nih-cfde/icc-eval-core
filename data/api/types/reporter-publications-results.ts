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
