import { uniqBy } from "lodash-es";
import { getProperties, getPropertyAnalytics } from "@/api/google-analytics";
import { log } from "@/util/log";
import { query, queryMulti } from "@/util/request";

/** get google analytics data */
export const getAnalytics = async () => {
  log("Getting Google Analytics properties");

  let properties = await query(
    () => getProperties(),
    "google-analytics-properties.json",
  );

  /** de-dupe */
  properties = uniqBy(properties, "property");

  const analytics = await queryMulti(
    properties.map((property) => () => getPropertyAnalytics(property.property)),
    "google-analytics-data.json",
  );

  return analytics;
};
