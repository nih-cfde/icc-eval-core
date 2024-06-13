import { writeFileSync } from "fs";
import { log } from "@/util/log";
import { db } from ".";

const reportPath = "../app/data.json";

/** collate data from db for generating report */
export const generateReport = async () => {
  log("info", "Generating report data");

  const opportunityPrefixes = await db
    .selectFrom("opportunity")
    .select(["prefix", (eb) => eb.fn.count("prefix").as("count")])
    .groupBy("prefix")
    .orderBy("count", "desc")
    .execute();

  const opportunityActivityCodes = await db
    .selectFrom("opportunity")
    .select(["activity_code", (eb) => eb.fn.count("activity_code").as("count")])
    .groupBy("activity_code")
    .orderBy("count", "desc")
    .execute();

  /** collated data */
  const data = {
    opportunities: {
      prefixes: opportunityPrefixes,
      activityCodes: opportunityActivityCodes,
    },
  };

  writeFileSync(reportPath, JSON.stringify(data));
};
