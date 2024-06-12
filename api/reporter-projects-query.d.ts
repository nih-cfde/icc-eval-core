export type ProjectsQuery = {
  search_id?: string;
  criteria?: Criteria;
  include_fields?: string[];
  exclude_fields?: string[];
  offset?: number;
  limit?: number;
  sort_field?: string;
  sort_order?: string;
};

export type Criteria = {
  use_relevance?: boolean;
  fiscal_years?: number[];
  include_active_projects?: boolean;
  pi_names?: Name[];
  po_names?: Name[];
  org_names?: string[];
  org_names_exact_match?: string[];
  pi_profile_ids?: number[];
  org_cities?: string[];
  org_states?: string[];
  project_nums?: string[];
  org_countries?: string[];
  appl_ids?: number[];
  project_num_split?: ProjectNumSplit;
  agencies?: string[];
  is_agency_admin?: boolean;
  is_agency_funding?: boolean;
  activity_codes?: string[];
  cooperative_agreement_codes?: string[];
  award_types?: string[];
  dept_types?: string[];
  cong_dists?: string[];
  foa?: string[];
  opportunity_numbers?: string[];
  spending_categories?: SpendingCategories;
  project_start_date?: AwardNoticeDate;
  project_end_date?: AwardNoticeDate;
  date_added?: AwardNoticeDate;
  organization_type?: string[];
  full_study_sections?: FullStudySection[];
  award_notice_date?: AwardNoticeDate;
  award_amount_range?: AwardAmountRange;
  exclude_subprojects?: boolean;
  multi_pi_only?: boolean;
  newly_added_projects_only?: boolean;
  sub_project_only?: boolean;
  funding_mechanism?: string[];
  covid_response?: string[];
  outcomes_only?: boolean;
  arra_type?: string[];
  advanced_text_search?: AdvancedTextSearch;
  publications_search?: PublicationsSearch;
};

export type AdvancedTextSearch = {
  search_text?: string;
  operator?: string;
  search_region?: string;
  search_field?: string;
};

export type AwardAmountRange = {
  min_amount?: number;
  max_amount?: number;
};

export type AwardNoticeDate = {
  from_date?: string;
  to_date?: string;
};

export type FullStudySection = {
  irg_code?: string;
  srg_code?: string;
  srg_flex?: string;
  sra_designator_code?: string;
  sra_flex_code?: string;
  group_code?: string;
  name?: string;
  url?: string;
  cmte_id?: number;
  cluster_irg_code?: string;
  properties?: Properties;
};

export type Properties = {
  additional_prop1?: string;
  additional_prop2?: string;
  additional_prop3?: string;
};

export type Name = {
  any_name?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
};

export type ProjectNumSplit = {
  appl_type_code?: string;
  activity_code?: string;
  ic_code?: string;
  serial_num?: string;
  support_year?: string;
  full_support_year?: string;
  suffix_code?: string;
};

export type PublicationsSearch = {
  publications_text_search?: string;
  pm_id?: string[];
  pmc_id?: string[];
  appl_id?: number[];
  core_project_nums?: string[];
  get_non_nihpubs?: boolean;
  filter_appl_ids?: boolean;
};

export type SpendingCategories = {
  values?: number[];
  match_all?: boolean;
};
