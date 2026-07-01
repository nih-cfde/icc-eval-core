import { AnalyticsAdminServiceClient } from "@google-analytics/admin";
import type { protos as AdminTypes } from "@google-analytics/admin";
import type { protos as DataTypes } from "@google-analytics/data";
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { memoize } from "@/util/memoize";

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
type FilterExpression =
  DataTypes.google.analytics.data.v1beta.IFilterExpression;

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
      throw Error((error as { details: string }).details ?? error, {
        cause: error,
      });
    }
  };

/** list all analytics properties we have access to */
export const getProperties = memoize(
  handleError(async () => {
    const properties: PropertyDetails[] = [];
    for await (const account of adminClient.listAccountSummariesAsync(
      {},
      { autoPaginate: false },
    ))
      for (const property of account.propertySummaries ?? [])
        if (property.property)
          properties.push(property as { property: PropertyId });
    return properties;
  }),
);

/** extract core project id from custom field that property owner defines */
export const getCoreProject = memoize(
  handleError(async (property: PropertyId) => {
    const metadata = await dataClient.getMetadata({
      name: `${property}/metadata`,
    });
    const json = JSON.stringify(metadata);
    return json.match(/cfde_(.*?)"/i)?.[1] ?? "";
  }),
);

/** run reports */
const runReports = memoize(
  async (property: PropertyId, requests: BatchReportRequest["requests"]) =>
    (
      await dataClient.batchRunReports({
        property,
        requests,
      })
    )[0]?.reports ?? [],
);

/** earliest allowed (~launch of google analytics) to present */
const dateRanges = [
  {
    startDate: "2015-08-14",
    endDate: new Date().toISOString().slice(0, 10),
  },
];

/** make exact match dimension filter */
const exactFilter = (fieldName: string, value: string) => ({
  filter: { fieldName, stringFilter: { matchType: "EXACT" as const, value } },
});

/** get metric values over time */
export const getOverTime = async (property: PropertyId) => {
  /** common report options */
  const options = {
    dateRanges,
    dimensions: [{ name: "date" }],
    orderBys: [{ desc: false, dimension: { dimensionName: "date" } }],
  };

  /** base metrics */
  const [report = {}] = await runReports(property, [
    {
      ...options,
      metrics: [
        { name: "activeUsers" },
        { name: "newUsers" },
        { name: "engagedSessions" },
      ],
    },
  ]);

  /** returning users */
  const [returning = {}] = await runReports(property, [
    {
      ...options,
      metrics: ["activeUsers"].map((metric) => ({ name: metric })),
      dimensionFilter: exactFilter("newVsReturning", "returning"),
    },
  ]);

  /** pretend "returningUsers" is real metric */
  report.metricHeaders?.push({ name: "returningUsers", type: "TYPE_INTEGER" });
  const returningMap = returning.rows?.reduce(
    (map, row) => {
      const key = row.dimensionValues?.[0]?.value;
      const value = row.metricValues?.[0]?.value;
      if (key && value) map[key] = value;
      return map;
    },
    {} as Record<string, string>,
  );
  report.rows?.forEach((row) => {
    const key = row.dimensionValues?.[0]?.value;
    const value = returningMap?.[key ?? ""];
    if (value) row.metricValues?.push({ value });
  });

  return [report];
};

/** get "top" (by different metrics) dimensions (regions/languages/etc.) */
export const getTopDimension = async (
  property: PropertyId,
  dimension: string,
) => {
  /** make options for one report */
  const report = (metric: string, filter?: FilterExpression) => ({
    dateRanges,
    dimensions: [{ name: dimension }],
    ...(filter ? { dimensionFilter: filter } : {}),
    metrics: [{ name: metric }],
    orderBys: [{ desc: true, metric: { metricName: metric } }],
    limit: 10,
  });

  /** run reports */
  const [
    activeUsers = {},
    newUsers = {},
    returningUsers = {},
    engagedSessions = {},
  ] = await runReports(property, [
    report("activeUsers"),
    report("newUsers"),
    report("activeUsers", exactFilter("newVsReturning", "returning")),
    report("engagedSessions"),
  ]);

  /** pretend "returningUsers" is real metric */
  returningUsers.metricHeaders = [
    { name: "returningUsers", type: "TYPE_INTEGER" },
  ];

  return [activeUsers, newUsers, returningUsers, engagedSessions];
};

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

/** get event counts by page path */
export const getEvents = async (
  property: PropertyId,
  eventName = "page_view",
) => {
  /** make options for one report */
  const report = (filter?: FilterExpression) => ({
    dateRanges,
    dimensions: [{ name: "pagePath" }],
    metrics: [{ name: "eventCount" }],
    orderBys: [{ desc: true, metric: { metricName: "eventCount" } }],
    dimensionFilter: {
      andGroup: {
        expressions: [
          ...(filter ? [filter] : []),
          exactFilter("eventName", eventName),
        ],
      },
    },
  });

  return runReports(property, [
    report(),
    report(exactFilter("newVsReturning", "new")),
    report(exactFilter("newVsReturning", "returning")),
  ]);
};
