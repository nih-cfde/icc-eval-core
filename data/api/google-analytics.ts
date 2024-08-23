import { eachMonthOfInterval, isAfter, isBefore } from "date-fns";
import { chunk } from "lodash-es";
import { AnalyticsAdminServiceClient } from "@google-analytics/admin";
import type { protos as AdminTypes } from "@google-analytics/admin";
import type { protos as DataTypes } from "@google-analytics/data";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { pairs } from "@/util/array";

/**
 * REFERENCES
 * https://developers.google.com/analytics/devguides/reporting/data/v1/basics
 * https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema
 * https://googleapis.dev/nodejs/analytics-data/latest/google.analytics.data.v1beta.BetaAnalyticsData.html
 */

type PropertyId = `properties/${string}`;
type PropertyDetails =
  AdminTypes.google.analytics.admin.v1alpha.IPropertySummary & {
    property: PropertyId;
  };
type BatchReportRequest =
  DataTypes.google.analytics.data.v1beta.IBatchRunReportsRequest;
type BatchReportResponse =
  DataTypes.google.analytics.data.v1beta.IBatchRunReportsResponse;

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

/** extract core project id from custom key event that property owner defines */
export const getCoreProject = handleError(async (property: PropertyId) => {
  const metadata = await dataClient.getMetadata({
    name: `${property}/metadata`,
  });
  const pattern = /^keyEvents:cfde_/i;
  const keyEvent = metadata[0].metrics?.find((metric) =>
    metric.apiName?.match(pattern),
  )?.apiName;
  return keyEvent?.replace(pattern, "");
});

/** make unlimited batch requests */
const batchReports = async (
  property: PropertyId,
  requests: BatchReportRequest["requests"],
) => {
  /** google limits us to only a few requests at a time */
  const chunks = chunk(requests, 5);

  /** all reports */
  const reports: BatchReportResponse["reports"] = [];

  /** perform batch reports, chunk by chunk */
  for (const requests of chunks) {
    const [response] = await dataClient.batchRunReports({ property, requests });
    reports.push(...(response?.reports ?? []));
  }

  return reports;
};

/** default date range, from earliest allowed to present */
const dateRanges = [{ startDate: "2015-08-14", endDate: "today" }];

/** results limit */
const limit = 5;

/** default set of metrics */
const metrics = [
  "activeUsers",
  "newUsers",
  "engagedSessions",
  // "sessions",
  // "screenPageViews",
];

/** get "top" (by different metrics) dimensions (regions/languages/etc.) */
export const getTopDimension = async (
  property: PropertyId,
  dimension: string,
) =>
  batchReports(
    property,
    metrics.map((metric) => ({
      dateRanges,
      dimensions: [{ name: dimension }],
      metrics: [{ name: metric }],
      orderBys: [{ desc: true, metric: { metricName: metric } }],
      limit,
    })),
  );

/** get top various dimensions */

export const getTopContinents = (property: PropertyId) =>
  getTopDimension(property, "continent");
export const getTopCountries = (property: PropertyId) =>
  getTopDimension(property, "country");
export const getTopRegions = (property: PropertyId) =>
  getTopDimension(property, "region");
export const getTopCities = (property: PropertyId) =>
  getTopDimension(property, "city");
export const getTopLanguages = (property: PropertyId) =>
  getTopDimension(property, "language");
export const getTopDevices = (property: PropertyId) =>
  getTopDimension(property, "deviceCategory");
export const getTopOSes = (property: PropertyId) =>
  getTopDimension(property, "operatingSystem");

/** get metric value over time (chunked monthly) */
export const getOverTime = async (property: PropertyId) => {
  /** earliest possible date */
  const start = new Date(dateRanges[0]!.startDate);
  /** latest possible date */
  const end = new Date();

  /** chunk earliest to latest possible date into ranges */
  const ranges: typeof dateRanges = pairs(
    eachMonthOfInterval({ start, end })
      .map((date) => {
        if (isBefore(date, start)) return start;
        if (isAfter(date, end)) return end;
        else return date;
      })
      .map((date) => date.toISOString().slice(0, 10)),
  ).map(([startDate, endDate]) => ({ startDate, endDate }));

  /** batch reports by date range */
  const results = await batchReports(
    property,
    ranges.map((range) => ({
      /**
       * supports multiple, but only up to 4, so just keep it simple and do 1 at
       * a time
       */
      dateRanges: [range],
      metrics: metrics.map((metric) => ({ name: metric })),
    })),
  );

  return results.map((result, index) => ({
    dateRange: ranges[index]!,
    ...result,
  }));
};
