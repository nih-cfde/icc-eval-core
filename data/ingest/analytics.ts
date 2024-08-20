import { getProperties } from "@/api/google-analytics";
import { log } from "@/util/log";
import { query } from "@/util/request";

/** get google analytics data */
export const getAnalytics = async () => {
  log("Getting Google Analytics properties");

  const properties = await query(
    () => getProperties(),
    "google-analytics-properties.json",
  );

  return properties;
};
