import { stringify } from "csv/sync";
import { AnalyticsAdminServiceClient } from "@google-analytics/admin";
import type { protos as AdminTypes } from "@google-analytics/admin";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

type Property = AdminTypes.google.analytics.admin.v1alpha.IPropertySummary & {
  property: string;
};

/** api clients */
const adminClient = new AnalyticsAdminServiceClient();
const dataClient = new BetaAnalyticsDataClient();

/** list all properties we have access to */
export const getProperties = async () => {
  const properties: Property[] = [];
  for await (const account of adminClient.listAccountSummariesAsync())
    for (const property of account.propertySummaries ?? [])
      if (property.property) properties.push(property as { property: string });
  return properties;
};

/** get analytics data about property */
export const getPropertyAnalytics = async (property: string) => {
  /** https://googleapis.dev/nodejs/analytics-data/latest/google.analytics.data.v1beta.IRunReportRequest.html */
  try {
    const [response] = await dataClient.runReport({
      property,
      dateRanges: [{ startDate: "2015-08-14", endDate: "today" }],
      /** https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema */
      dimensions: [
        { name: "country" },
        { name: "continent" },
        { name: "date" },
        { name: "deviceCategory" },
        { name: "languageCode" },
        { name: "region" },
      ],
      metrics: [
        { name: "active28DayUsers" },
        { name: "activeUsers" },
        { name: "bounceRate" },
        { name: "engagedSessions" },
        { name: "engagementRate" },
        { name: "eventCount" },
        { name: "eventCountPerUser" },
        { name: "newUsers" },
        { name: "screenPageViews" },
      ],
    });

    /** compress response */
    const transformedResponse = {
      property,
      csv: stringify([
        [
          ...(response.dimensionHeaders?.map((header) => header.name ?? "") ??
            []),
          ...(response.metricHeaders?.map((header) => header.name ?? "") ?? []),
        ],
        ...(response.rows?.map((row) => [
          ...(row.dimensionValues?.map((value) => value.value ?? "") ?? []),
          ...(row.metricValues?.map((value) => value.value ?? "") ?? []),
        ]) ?? []),
      ]),
    };

    return transformedResponse;
  } catch (error) {
    /** non-standard error */
    throw Error((error as { details: string }).details);
  }
};
