import { Insertable } from "kysely";
import { Opportunity } from "./opportunities";

export type Database = {
  opportunity: Insertable<Opportunity>;
};
