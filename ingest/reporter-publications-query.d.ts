/**
 * auto-generated typescript types for reporter API
 *
 * 1. copy "Example Value" from https://api.reporter.nih.gov/
 * 2. convert key names to snake_case on
 *    https://www.better-converter.com/JSON-Modifiers/Json-Snake-Case-Converter
 *    or https://toolslick.com/text/formatter/json
 * 3. run through https://app.quicktype.io/?l=ts with only these options checked:
 *    "interfaces only", "use types instead of interfaces", "use string instead
 *    of enum", "make all properties optional"
 */

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
