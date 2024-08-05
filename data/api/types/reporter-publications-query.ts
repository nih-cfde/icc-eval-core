export type PublicationsQuery = {
  criteria?: Criteria;
  offset?: number;
  limit?: number;
  sort_field?: string;
  sort_order?: string;
};

export type Criteria = {
  pmids?: number[];
  appl_ids?: number[];
  core_project_nums?: string[];
};
