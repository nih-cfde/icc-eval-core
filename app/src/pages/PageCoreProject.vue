<template>
  <section>
    <h1><Microscope />Core Project {{ id }}</h1>
  </section>

  <!-- details -->
  <section>
    <h2>Details</h2>

    <dl class="details">
      <div
        v-for="([name, ...detail], detailIndex) in details"
        :key="detailIndex"
      >
        <dt>{{ name }}</dt>
        <dd>
          <template v-for="(line, lineIndex) of detail" :key="lineIndex">
            <template v-if="!Array.isArray(line) || line[0] !== '0'">
              {{ [line].flat().join(" ") }}
              <br />
            </template>
          </template>
        </dd>
      </div>
    </dl>
  </section>

  <!-- publications -->
  <section>
    <h2>Publications</h2>

    <p>Published works associated with this project.</p>

    <AppTable
      :cols="publicationCols"
      :rows="projectPublications"
      :sort="[{ id: 'relative_citation_ratio', desc: true }]"
    >
      <template #id="{ row }">
        <span>
          <AppLink :to="`https://pubmed.ncbi.nlm.nih.gov/${row.id}`">
            {{ row.id }}
          </AppLink>
          <br />
          <AppLink :to="`https://doi.org/${row.doi}`">DOI</AppLink>
        </span>
      </template>

      <template #authors="{ row }">
        <template v-for="(author, index) of carve(row.authors, 2)" :key="index">
          {{ author }}
          <br />
        </template>
      </template>

      <template #modified="{ row }">
        {{ row.modified.toLocaleString(undefined, { dateStyle: "medium" }) }}
        <br />
        ({{ ago(row.modified) }})
      </template>
    </AppTable>

    <dl class="mini-table">
      <dt>RCR</dt>
      <dd>
        <AppLink to="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5012559/"
          >Relative Citation Ratio</AppLink
        >
      </dd>
      <dt>SJR</dt>
      <dd>
        <AppLink to="https://www.scimagojr.com/journalrank.php"
          >Scimago Journal Rank</AppLink
        >
      </dd>
    </dl>

    <!-- charts -->
    <template v-if="Object.keys(publicationsOverTime).length > 1">
      <AppCheckbox v-model="cumulative">Cumulative</AppCheckbox>

      <AppLineChart
        class="chart"
        :title="
          cumulative ? 'Cumulative Publications' : 'Publications Per Year'
        "
        :data="publicationsOverTime"
        :cumulative="cumulative"
      />
    </template>
  </section>

  <!-- repositories -->
  <section>
    <h2>Repositories</h2>

    <p>Software repositories associated with this project.</p>

    <AppTable
      :cols="repoColsA"
      :rows="projectRepos"
      :sort="[{ id: 'id', desc: true }]"
    >
      <template #name="{ row }">
        <AppLink :to="`https://github.com/${row.owner}/${row.name}`"
          >{{ row.owner }}/{{ row.name }}</AppLink
        >
      </template>

      <template #issues="{ row }">
        {{ row.closed_issues.toLocaleString() }} ✔
        <br />
        {{ row.open_issues.toLocaleString() }} ◯
      </template>

      <template #pull-requests="{ row }">
        {{ row.closed_pull_requests.toLocaleString() }} ✔
        <br />
        {{ row.open_pull_requests.toLocaleString() }} ◯
      </template>

      <template #modified="{ row }">
        {{ row.modified.toLocaleString(undefined, { dateStyle: "medium" }) }}
        <br />
        ({{ ago(row.modified) }})
      </template>
    </AppTable>

    <AppTable
      :cols="repoColsB"
      :rows="projectRepos"
      :sort="[{ id: 'id', desc: true }]"
    >
      <template #name="{ row }">
        <AppLink :to="`https://github.com/${row.owner}/${row.name}`"
          >{{ row.owner }}/{{ row.name }}</AppLink
        >
      </template>

      <template #modified="{ row }">
        {{ row.modified.toLocaleString(undefined, { dateStyle: "medium" }) }}
        <br />
        ({{ ago(row.modified) }})
      </template>

      <template #topics="{ row }">
        {{ limit(row.topics, 5).join(" ") }}
      </template>

      <template #languages="{ row }">
        {{
          limit(
            row.languages.map(({ language }) => language),
            5,
          ).join(" ")
        }}
      </template>
    </AppTable>

    <dl class="mini-table">
      <dt>PR</dt>
      <dd>Pull (change) request</dd>
      <dt>✔ ◯</dt>
      <dd>Closed/open</dd>
      <dt>Avg Issue/PR</dt>
      <dd>
        Average time issues/pull requests stay open for before being closed
      </dd>
    </dl>

    <div class="notes">
      <p>Notes</p>
      <p>
        Only the <code>main</code> (or default) branch is considered (e.g. for #
        of commits).
      </p>
      <p>
        # of dependencies is totaled from all manifests in repo, direct and
        transitive, e.g.
        <code>package.json</code> + <code>package-lock.json</code>.
      </p>
    </div>

    <template v-if="projectRepos.length">
      <AppCheckbox v-model="cumulative">Cumulative</AppCheckbox>

      <div class="charts">
        <AppLineChart
          class="chart"
          :title="cumulative ? 'Cumulative Stars' : 'Stars Per Year'"
          :data="starsOverTime"
          :cumulative="cumulative"
        />
        <AppLineChart
          class="chart"
          :title="cumulative ? 'Cumulative Forks' : 'Forks Per Year'"
          :data="forksOverTime"
          :cumulative="cumulative"
        />
        <AppLineChart
          class="chart"
          :title="cumulative ? 'Cumulative Issues' : 'Issues Per Year'"
          :data="issuesOverTime"
          :cumulative="cumulative"
        />
        <AppLineChart
          class="chart"
          :title="
            cumulative ? 'Cumulative Pull Requests' : 'Pull Requests Per Year'
          "
          :data="pullRequestsOverTime"
          :cumulative="cumulative"
        />
        <AppLineChart
          class="chart"
          :title="cumulative ? 'Cumulative Commits' : 'Commits Per Year'"
          :data="commitsOverTime"
          :cumulative="cumulative"
        />
      </div>
    </template>
  </section>

  <!-- analytics -->
  <section>
    <h2>Analytics</h2>

    <p>Traffic metrics of public websites associated with this project.</p>

    <div class="charts">
      <template
        v-for="({ metric, values }, key) in overTimeAnalytics?.metrics"
        :key="key"
      >
        <AppLineChart
          :title="startCase(metric)"
          :data="
            Object.fromEntries(
              overTimeAnalytics?.dateRanges?.map((range, index) => [
                range.startDate,
                values[index]!,
              ]) ?? [],
            )
          "
        />
      </template>
    </div>

    <dl class="mini-table">
      <dt>Active Users</dt>
      <dd>
        <AppLink
          to="https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema#:~:text=activeUsers"
          >Distinct users who visited the website</AppLink
        >
      </dd>
      <dt>New Users</dt>
      <dd>
        <AppLink
          to="https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema#:~:text=newUsers"
          >Users who visited the website for the first time</AppLink
        >
      </dd>
      <dt>Engaged Sessions</dt>
      <dd>
        <AppLink
          to="https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema#:~:text=engagedSessions"
          >Visits that had significant interaction.</AppLink
        >
      </dd>
    </dl>

    <div class="details">
      <div v-for="(topValue, topKey) in topAnalytics" :key="topKey">
        <template
          v-if="typeof topValue === 'object' && 'byEngagedSessions' in topValue"
        >
          <dt>Top {{ topKey.replace("top", "") }}</dt>
          <dd>
            <template
              v-for="(byValue, byKey) in topValue.byEngagedSessions"
              :key="byKey"
            >
              {{ byKey }} ({{ byValue.toLocaleString() }})<br />
            </template>
          </dd>
        </template>
      </div>
    </div>

    <div class="notes">
      <p>Notes</p>
      <p>
        "Top" metrics are measured by number of
        <AppLink to="https://support.google.com/analytics/answer/9191807"
          >engaged sessions</AppLink
        >
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { fromPairs, orderBy, startCase, sum, sumBy, toPairs } from "lodash";
import { useTitle } from "@vueuse/core";
import Microscope from "@/assets/microscope.svg";
import AppCheckbox from "@/components/AppCheckbox.vue";
import AppLineChart from "@/components/AppLineChart.vue";
import AppLink from "@/components/AppLink.vue";
import AppTable, { type Cols } from "@/components/AppTable.vue";
import { carve, limit } from "@/util/array";
import { overTime } from "@/util/data";
import { ago, match, printObject, span } from "@/util/string";
import { getEntries } from "@/util/types";
import analytics from "~/analytics.json";
import coreProjects from "~/core-projects.json";
import journals from "~/journals.json";
import publications from "~/publications.json";
import rawRepos from "~/repos.json";

type Repo = Omit<(typeof rawRepos)[number], "dependencies"> & {
  dependencies: Record<string, number | undefined>;
};

const repos = rawRepos as Repo[];

const route = useRoute();

/** whether charts should be shown in cumulative mode */
const cumulative = ref(true);

/** currently viewed core project id */
const id = computed(() =>
  Array.isArray(route.params.id) ? route.params.id[0] : route.params.id,
);

/** set tab title */
const { VITE_TITLE } = import.meta.env;
useTitle(computed(() => `${id.value} | ${VITE_TITLE}`));

/** currently viewed core project (details) */
const coreProject = computed(
  () => coreProjects.find((coreProject) => coreProject.id === id.value)!,
);

/** top-level details */
const details = computed(() => [
  ["Projects", ...coreProject.value.projects],
  ["Name", coreProject.value.name],
  [
    "Award",
    coreProject.value.award_amount.toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
    }),
  ],
  ["Publications", projectPublications.value.length.toLocaleString()],
  [
    "Repositories",
    projectRepos.value.length.toLocaleString(),
    [sumBy(projectRepos.value, "stars.length").toLocaleString(), "stars"],
    [sumBy(projectRepos.value, "watchers").toLocaleString(), "watchers"],
    [sumBy(projectRepos.value, "forks.length").toLocaleString(), "forks"],
    [sumBy(projectRepos.value, "issues.length").toLocaleString(), "issues"],
    [
      sumBy(projectRepos.value, "pull_requests.length").toLocaleString(),
      "pull requests",
    ],
    [sumBy(projectRepos.value, "commits.length").toLocaleString(), "commits"],
    [
      sumBy(projectRepos.value, "contributors.length").toLocaleString(),
      "contributors",
    ],
  ],
]);

/** publication table row data */
const projectPublications = computed(() =>
  /** get publication matching this core project */
  publications
    .filter((publication) => publication.core_project === id.value)
    .map((publication) => {
      /** look up journal matching this publication */
      const journal = journals.find(
        (journal) => journal.id === publication.journal,
      );
      /** include journal info */
      return {
        ...publication,
        modified: new Date(publication.modified),
        rank: journal?.rank ?? 0,
        journal: journal?.name ?? publication.journal,
      };
    }),
);

/** publication table column definitions */
const publicationCols: Cols<typeof projectPublications.value> = [
  {
    slot: "id",
    key: "id",
    name: "ID",
    align: "left",
    style: { whiteSpace: "nowrap" },
  },
  {
    key: "title",
    name: "Title",
    align: "left",
  },
  {
    slot: "authors",
    key: "authors",
    name: "Authors",
    align: "left",
  },
  {
    key: "relative_citation_ratio",
    name: "RCR",
  },
  {
    key: "rank",
    name: "SJR",
  },
  {
    key: "citations",
    name: "Citations",
  },
  {
    key: "citations_per_year",
    name: "Cit./year",
  },
  {
    key: "journal",
    name: "Journal",
    align: "left",
  },
  {
    key: "year",
    name: "Published",
  },
  {
    slot: "modified",
    key: "modified",
    name: "Updated",
  },
];

/** publication chart data */
const publicationsOverTime = computed(() =>
  overTime(projectPublications.value, "year"),
);

/** repo table row data */
const projectRepos = computed(() =>
  repos
    .filter((repo) => repo.core_project === id.value)
    .map((repo) => ({
      ...repo,
      issue_time_open: span(repo.issue_time_open),
      pull_request_time_open: span(repo.pull_request_time_open),
      modified: new Date(repo.modified),
      dependency_total: sum(Object.values(repo.dependencies)),
      ...repo.dependencies,
    })),
);

/** repo table column definitions */
const repoColsA: Cols<typeof projectRepos.value> = [
  {
    slot: "name",
    key: "id",
    name: "Name",
    align: "left",
  },
  {
    key: "description",
    name: "Description",
    align: "left",
  },
  {
    key: "stars",
    name: "Stars",
  },
  {
    key: "watchers",
    name: "Watchers",
  },
  {
    key: "forks",
    name: "Forks",
  },
  {
    key: "issues",
    slot: "issues",
    name: "Issues",
    style: { whiteSpace: "nowrap" },
  },
  {
    key: "pull_requests",
    slot: "pull-requests",
    name: "PRs",
    style: { whiteSpace: "nowrap" },
  },
  {
    key: "commits",
    name: "Commits",
  },
  {
    key: "contributors",
    name: "Contrib.",
  },
];
const repoColsB: Cols<typeof projectRepos.value> = [
  {
    slot: "name",
    key: "id",
    name: "Name",
    align: "left",
  },
  {
    slot: "topics",
    key: "topics",
    name: "Tags",
    align: "left",
  },
  {
    slot: "modified",
    key: "modified",
    name: "Last Commit",
  },
  {
    key: "issue_time_open",
    name: "Avg Issue",
  },
  {
    key: "pull_request_time_open",
    name: "Avg PR",
  },
  {
    slot: "languages",
    key: "languages",
    name: "Languages",
    attrs: (row) => ({
      title: row?.languages
        .map(({ language, count }) => `${language}: ${count}`)
        .join("\n"),
    }),
  },
  {
    key: "license",
    name: "License",
  },
  {
    key: "readme",
    name: "Readme",
  },
  {
    key: "contributing",
    name: "Contributing",
  },
  {
    slot: "dependencies",
    key: "dependency_total",
    name: "Dependencies",
    attrs: (row) => ({
      title: printObject(row?.dependencies),
    }),
  },
];

/** star chart data */
const starsOverTime = computed(() =>
  overTime(projectRepos.value.map((repo) => repo.stars).flat(), (d) =>
    new Date(d).getUTCFullYear(),
  ),
);

/** fork chart data */
const forksOverTime = computed(() =>
  overTime(projectRepos.value.map((repo) => repo.forks).flat(), (d) =>
    new Date(d).getUTCFullYear(),
  ),
);

/** issue chart data */
const issuesOverTime = computed(() =>
  overTime(
    projectRepos.value
      .map((repo) => repo.issues.map((issue) => issue.created))
      .flat(),
    (d) => new Date(d).getUTCFullYear(),
  ),
);

/** issue chart data */
const pullRequestsOverTime = computed(() =>
  overTime(
    projectRepos.value
      .map((repo) =>
        repo.pull_requests.map((pull_request) => pull_request.created),
      )
      .flat(),
    (d) => new Date(d).getUTCFullYear(),
  ),
);

/** commit chart data */
const commitsOverTime = computed(() =>
  overTime(projectRepos.value.map((repo) => repo.commits).flat(), (d) =>
    new Date(d).getUTCFullYear(),
  ),
);

/** "over time" analytics data */
const overTimeAnalytics = computed(() => {
  /** get properties matching this project */
  const properties = analytics
    .filter((item) => match(item.core_project, id.value ?? ""))
    .map((item) => item.overTime);

  /** total values from all properties */
  const total = properties[0];
  if (properties.length > 0 && total) {
    const metrics = total.metrics.length;
    const values = total.metrics[0]?.values?.length ?? 0;
    for (const property of properties.slice(1))
      for (let metricIndex = 0; metricIndex < metrics; metricIndex++)
        for (let valueIndex = 0; valueIndex < values; valueIndex++)
          total!.metrics[metricIndex]!.values[valueIndex]! +=
            property.metrics[metricIndex]!.values[valueIndex]!;
  }

  return total;
});

/** "top dimensions" analytics data */
const topAnalytics = computed(() => {
  /** get properties matching this project */
  const properties = analytics
    .filter((item) => match(item.core_project, id.value ?? ""))
    .map(({ property, propertyName, core_project, overTime, ...rest }) => rest);

  /** total values from all properties */
  const total: Record<string, Record<string, Record<string, number>>> = {};

  /** go through each property and total values */
  for (const property of properties)
    for (const [topKey, topValue] of getEntries(property))
      for (const [byKey, byValue] of getEntries(topValue))
        for (const [dimensionKey, dimensionValue] of getEntries(byValue)) {
          total[topKey] ??= {};
          total[topKey][byKey] ??= {};
          total[topKey][byKey][dimensionKey] ??= 0;
          total[topKey][byKey][dimensionKey] += dimensionValue;
        }

  /** sort counts */
  for (const [, topValue] of getEntries(total))
    for (let [, byValue] of getEntries(topValue))
      byValue = fromPairs(orderBy(toPairs(byValue), [1], ["desc"]));

  return total;
});
</script>
