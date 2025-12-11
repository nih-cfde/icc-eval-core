export type Results = {
  meta: Meta;
  links: Links;
  data: Datum[];
};

export type Datum = {
  _id?: string;
  authors?: {
    lastName?: string;
    fullName?: string;
    firstName?: string;
  }[];
  doi?: string;
  pmid?: number;
  title?: string;
  animal?: number;
  apt?: number;
  human?: number;
  citedByPmidsByYear?: Record<string, number>[];
  citedByClinicalArticle?: boolean;
  year?: number;
  journal?: string;
  is_research_article?: boolean;
  citation_count?: number;
  field_citation_rate?: number;
  expected_citations_per_year?: number;
  citations_per_year?: number;
  relative_citation_ratio?: number;
  nih_percentile?: null;
  molecular_cellular?: number;
  x_coord?: number;
  y_coord?: number;
  is_clinical?: boolean;
  cited_by_clin?: null;
  cited_by?: number[];
  references?: number[];
  provisional?: boolean;
  last_modified?: Date;
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
