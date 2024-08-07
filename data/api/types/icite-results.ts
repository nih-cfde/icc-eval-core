export type Results = {
  meta: Meta;
  links: Links;
  data: Datum[];
};

export type Datum = {
  pmid?: number;
  year?: number;
  title?: string;
  authors?: string;
  journal?: string;
  is_research_article?: string;
  relative_citation_ratio?: number;
  nih_percentile?: null;
  human?: number;
  animal?: number;
  molecular_cellular?: number;
  apt?: number;
  is_clinical?: string;
  citation_count?: number;
  citations_per_year?: number;
  expected_citations_per_year?: number | null;
  field_citation_rate?: number | null;
  provisional?: string;
  x_coord?: number;
  y_coord?: number;
  cited_by_clin?: number[] | null;
  cited_by?: number[];
  references?: number[];
  doi?: string;
  last_modified?: string;
};

export type Links = {
  self?: string;
  next?: string;
};

export type Meta = {
  limit?: number;
  offset?: number;
  fl?: string;
};
