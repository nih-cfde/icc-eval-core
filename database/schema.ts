import { Insertable } from "kysely";
import { Funding } from "./fundings";

export type Database = {
  funding: Insertable<Funding>;
};
