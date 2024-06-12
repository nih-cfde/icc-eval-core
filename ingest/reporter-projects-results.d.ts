/**
 * auto-generated typescript types for reporter API
 *
 * 1. run script below in browser dev tools
 * 2. run result through https://app.quicktype.io/?l=ts
 */

// fetch("https://api.reporter.nih.gov/v2/projects/search", {
//   method: "POST",
//   headers: { "Accept": "application/json", "Content-Type": "application/json" },
//   body: JSON.stringify({ criteria: {}, limit: 500 }),
// })
//   .then((r) => r.json())
//   .then(console.log);

export type ProjectsResults = {
  meta: Meta;
  results: Result[];
};

export type Meta = {
  search_id?: string;
  total?: number;
  offset?: number;
  limit?: number;
  sort_field?: null;
  sort_order?: string;
  sorted_by_relevance?: boolean;
  properties?: Properties;
};

export type Properties = {
  URL?: string;
};

export type Result = {
  appl_id?: number;
  subproject_id?: null | string;
  fiscal_year?: number;
  project_num?: string;
  project_serial_num?: null | string;
  organization?: Organization;
  award_type?: null | string;
  activity_code?: null | string;
  award_amount?: number | null;
  is_active?: boolean;
  project_num_split?: ProjectNumSplit | null;
  principal_investigators?: PrincipalInvestigator[];
  contact_pi_name?: string;
  program_officers?: ProgramOfficer[];
  agency_ic_admin?: AgencyicAdmin;
  agency_ic_fundings?: AgencyicFunding[] | null;
  cong_dist?: null | string;
  spending_categories?: number[] | null;
  project_start_date?: null | string;
  project_end_date?: null | string;
  organization_type?: OrganizationType;
  opportunity_number?: null | string;
  full_study_section?: FullStudySection | null;
  award_notice_date?: null | string;
  is_new?: boolean;
  mechanism_code_dc?: null | string;
  core_project_num?: string;
  terms?: null | string;
  pref_terms?: null | string;
  abstract_text?: null | string;
  project_title?: string;
  phr_text?: null | string;
  spending_categories_desc?: null | string;
  agency_code?: string;
  covid_response?: null;
  arra_funded?: null | string;
  budget_start?: null | string;
  budget_end?: null | string;
  cfda_code?: null | string;
  funding_mechanism?: null | string;
  direct_cost_amt?: number | null;
  indirect_cost_amt?: number | null;
  project_detail_url?: string;
  date_added?: string;
};

export type AgencyicAdmin = {
  code?: string;
  abbreviation?: string;
  name?: string;
};

export type AgencyicFunding = {
  fy?: number;
  code?: string;
  name?: string;
  abbreviation?: string;
  total_cost?: number;
};

export type FullStudySection = {
  srg_code?: string;
  srg_flex?: string;
  sra_designator_code?: string;
  sra_flex_code?: string;
  group_code?: string;
  name?: string;
};

export type Organization = {
  org_name?: null | string;
  city?: null;
  country?: null;
  org_city?: null | string;
  org_country?: null | string;
  org_state?: null | string;
  org_state_name?: null;
  dept_type?: null | string;
  fips_country_code?: null;
  org_duns?: string[] | null;
  org_ueis?: string[] | null;
  primary_duns?: null | string;
  primary_uei?: null | string;
  org_fips?: null | string;
  org_ipf_code?: null | string;
  org_zipcode?: null | string;
  external_org_id?: number | null;
};

export type OrganizationType = {
  name?: string;
  code?: null | string;
  is_other?: boolean;
};

export type PrincipalInvestigator = {
  profile_id?: number | null;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  is_contact_pi?: boolean;
  full_name?: string;
  title?: string;
};

export type ProgramOfficer = {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  full_name?: string;
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
