import { AnalyticsAdminServiceClient } from "@google-analytics/admin";
import type { protos as AdminTypes } from "@google-analytics/admin";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

type PropertyId = `properties/${string}`;
type PropertyDetails =
  AdminTypes.google.analytics.admin.v1alpha.IPropertySummary & {
    property: PropertyId;
  };

/** api clients */
const adminClient = new AnalyticsAdminServiceClient();
const dataClient = new BetaAnalyticsDataClient();

/** handling for google analytics non-standard errors */
const handleError =
  <Params extends unknown[], Return>(
    func: (...params: Params) => Promise<Return>,
  ) =>
  async (...params: Params) => {
    try {
      return await func(...params);
    } catch (error) {
      throw Error((error as { details: string }).details ?? error);
    }
  };

/** list all analytics properties we have access to */
export const getProperties = handleError(async () => {
  const properties: PropertyDetails[] = [];
  for await (const account of adminClient.listAccountSummariesAsync())
    for (const property of account.propertySummaries ?? [])
      if (property.property)
        properties.push(property as { property: PropertyId });
  return properties;
});

/** extract project name from custom key event that property owner defines */
export const getProject = handleError(async (property: PropertyId) => {
  const metadata = await dataClient.getMetadata({
    name: `${property}/metadata`,
  });
  const pattern = /^keyEvents:cfde_/i;
  const keyEvent =
    metadata[0].metrics?.find((metric) => metric.apiName?.match(pattern))
      ?.apiName ?? "";
  return keyEvent.replace(pattern, "").toLowerCase();
});

/** default date range, from earliest allowed to present */
const dateRanges = [{ startDate: "2015-08-14", endDate: "today" }];

/** pivot limit */
const limit = 5;

/** get "top" (by different metrics) dimension */
export const getTopDimension = async (
  property: PropertyId,
  dimension: string,
) => {
  const metrics = [
    // "activeUsers",
    // "bounceRate",
    // "engagedSessions",
    // "engagementRate",
    // "newUsers",
    // "screenPageViews",
    "sessions",
    // "sessionsPerUser",
  ];
  const [response] = await dataClient.batchRunReports({
    property,
    requests: metrics.map((metric) => ({
      dateRanges,
      dimensions: [{ name: dimension }],
      metrics: [{ name: metric }],
      orderBys: [{ desc: true, metric: { metricName: metric } }],
      limit,
    })),
  });
  return response;
};

/** get top various dimensions */

export const getTopRegions = (property: PropertyId) =>
  getTopDimension(property, "region");
export const getTopContinents = (property: PropertyId) =>
  getTopDimension(property, "continent");
export const getTopCountries = (property: PropertyId) =>
  getTopDimension(property, "country");
export const getTopLanguages = (property: PropertyId) =>
  getTopDimension(property, "language");
export const getTopDevices = (property: PropertyId) =>
  getTopDimension(property, "deviceCategory");
