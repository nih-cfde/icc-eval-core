<template>
  <section>
    <AppHeading level="1"><Microscope />Core Project {{ id }}</AppHeading>
  </section>

  <!-- overview -->
  <section>
    <AppHeading level="2"><Eye />Overview</AppHeading>

    <p>High-level info about this project.</p>

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
    <AppHeading level="2"><Book />Publications</AppHeading>

    <p>Published works associated with this project.</p>

    <AppTable
      :cols="publicationCols"
      :rows="projectPublications"
      :sort="[{ id: 'relativeCitationRatio', desc: true }]"
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
        <template v-for="(author, key) of carve(row.authors, 2)" :key="key">
          {{ author }}
          <br />
        </template>
      </template>

      <template #year="{ row }">{{ row.year }}</template>
    </AppTable>

    <template v-if="publicationsOverTime.length > 1">
      <div class="charts">
        <AppTimeChart
          class="chart"
          title="Publications"
          :data="publicationsOverTime"
          :cumulative="cumulative"
          by="month"
        />
      </div>

      <AppCheckbox v-model="cumulative">Cumulative</AppCheckbox>
    </template>

    <div class="col">
      <AppHeading level="3">Notes</AppHeading>

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
    </div>
  </section>

  <!-- repositories -->
  <section>
    <AppHeading level="2"><Code />Repositories</AppHeading>

    <p>Software repositories associated with this project.</p>

    <AppTable
      :cols="repoCols"
      :rows="projectRepos"
      :sort="[{ id: 'id', desc: true }]"
    >
      <template #owner="{ row }">
        <AppLink :to="`https://github.com/${row.owner}`">
          {{ row.owner }}
        </AppLink>
      </template>

      <template #name="{ row }">
        <AppLink :to="`https://github.com/${row.owner}/${row.name}`">
          {{ row.name }}
        </AppLink>
      </template>

      <template #topics="{ row }">
        {{ limit(row.topics, 5).join(", ") }}
      </template>

      <template #modified="{ row }">
        {{ format(row.modified) }}
        <br />
        {{ ago(row.modified) }} ago
      </template>

      <template #issues="{ row }">
        Closed: {{ format(row.closedIssues, true) }}
        <br />
        Open: {{ format(row.openIssues, true) }}
      </template>

      <template #pull-requests="{ row }">
        Closed: {{ format(row.closedPullRequests, true) }}
        <br />
        Open: {{ format(row.openPullRequests, true) }}
      </template>

      <template #issue-time-open="{ row }">
        {{ span(row.issueTimeOpen) }}
      </template>

      <template #pull-request-time-open="{ row }">
        {{ span(row.pullRequestTimeOpen) }}
      </template>

      <template #languages="{ row }">
        {{
          limit(
            row.languages.map(({ name }) => name),
            3,
          ).join(", ")
        }}
      </template>
    </AppTable>

    <template v-if="projectRepos.length">
      <div class="charts">
        <AppTimeChart
          class="chart"
          title="Stars"
          :data="starsOverTime"
          :cumulative="cumulative"
          by="month"
        />
        <AppTimeChart
          class="chart"
          title="Forks"
          :data="forksOverTime"
          :cumulative="cumulative"
          by="month"
        />
        <AppTimeChart
          class="chart"
          title="Issues"
          :data="issuesOverTime"
          :cumulative="cumulative"
          by="month"
        />
        <AppTimeChart
          class="chart"
          title="Pull Requests"
          :data="pullRequestsOverTime"
          :cumulative="cumulative"
          by="month"
        />
        <AppTimeChart
          class="chart"
          title="Commits"
          :data="commitsOverTime"
          :cumulative="cumulative"
          by="month"
        />
      </div>

      <AppCheckbox v-model="cumulative">Cumulative</AppCheckbox>
    </template>

    <div class="col">
      <AppHeading level="3">Notes</AppHeading>

      <dl class="mini-table">
        <dt>Repository</dt>
        <dd>
          For storing, tracking changes to, and collaborating on a piece of
          software.
        </dd>
        <dt>PR</dt>
        <dd>
          "Pull request", a draft change (new feature, bug fix, etc.) to a repo.
        </dd>
        <dt>Closed/Open</dt>
        <dd>Resolved/unresolved.</dd>
        <dt>Issue/PR Avg</dt>
        <dd>
          Average time issues/pull requests stay open for before being closed.
        </dd>
      </dl>

      <p>
        Only the <code>main</code>/default branch is considered for metrics like
        # of commits.
      </p>

      <p>
        # of dependencies is totaled from all manifests in repo, direct and
        transitive, e.g.
        <code>package.json</code> + <code>package-lock.json</code>.
      </p>
    </div>
  </section>

  <!-- analytics -->
  <section>
    <AppHeading level="2"><Analytics />Analytics</AppHeading>

    <p>Website metrics associated with this project.</p>

    <template v-if="analyticsProperties.length">
      <dl class="details">
        <div>
          <dt>Websites</dt>
          <dd class="mini-table">
            <template
              v-for="({ property, propertyName }, key) of analyticsProperties"
              :key="key"
            >
              <span>
                {{ startCase(propertyName) }}
              </span>
              <span>#{{ property.replace("properties/", "") }}</span>
            </template>
          </dd>
        </div>
      </dl>

      <div class="charts">
        <template
          v-for="({ metric, data }, key) in overTimeAnalytics"
          :key="key"
        >
          <AppTimeChart
            :title="startCase(metric)"
            :data="data"
            :cumulative="cumulative"
            by="week"
            group="group"
          />
        </template>
      </div>

      <AppCheckbox v-model="cumulative">Cumulative</AppCheckbox>

      <dl class="details">
        <div v-for="(topValue, topKey) in topAnalytics" :key="topKey">
          <template
            v-if="
              typeof topValue === 'object' && 'byEngagedSessions' in topValue
            "
          >
            <dt>Top {{ topKey.replace("top", "") }}</dt>
            <dd class="mini-table">
              <template
                v-for="(byValue, byKey) in topValue.byEngagedSessions"
                :key="byKey"
              >
                <span>
                  {{ byKey }}
                </span>
                <span>
                  {{ format(byValue, true) }}
                </span>
              </template>
            </dd>
          </template>
        </div>
      </dl>
    </template>

    <div class="col">
      <AppHeading level="3">Notes</AppHeading>

      <dl class="mini-table">
        <dt>Active Users</dt>
        <dd>
          <AppLink
            to="https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema#:~:text=activeUsers"
            >Distinct users who visited the website</AppLink
          >.
        </dd>
        <dt>New Users</dt>
        <dd>
          <AppLink
            to="https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema#:~:text=newUsers"
            >Users who visited the website for the first time</AppLink
          >.
        </dd>
        <dt>Engaged Sessions</dt>
        <dd>
          <AppLink
            to="https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema#:~:text=engagedSessions"
            >Visits that had significant interaction</AppLink
          >.
        </dd>
      </dl>

      <p>"Top" metrics are measured by number of engaged sessions.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { orderBy, startCase, sum, sumBy, uniq } from "lodash";
import { useTitle } from "@vueuse/core";
import Analytics from "@/assets/analytics.svg";
import Book from "@/assets/book.svg";
import Code from "@/assets/code.svg";
import Eye from "@/assets/eye.svg";
import Microscope from "@/assets/microscope.svg";
import AppCheckbox from "@/components/AppCheckbox.vue";
import AppHeading from "@/components/AppHeading.vue";
import AppLink from "@/components/AppLink.vue";
import AppTable, { type Cols } from "@/components/AppTable.vue";
import AppTimeChart from "@/components/AppTimeChart.vue";
import { carve, limit } from "@/util/array";
import { ago, format, match, printObject, span } from "@/util/string";
import { getEntries } from "@/util/types";
import analytics from "~/analytics.json";
import coreProjects from "~/core-projects.json";
import journals from "~/journals.json";
import publications from "~/publications.json";
import repos from "~/repos.json";

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
    format(coreProject.value.awardAmount, true, {
      style: "currency",
      currency: "USD",
    }),
  ],
  ["Publications", `${format(projectPublications.value, true)} publications`],
  [
    "Repositories",
    `${format(projectRepos.value, true)} repositories`,
    [
      format(
        sumBy(projectRepos.value, (repo) => repo.stars.length),
        true,
      ),
      "stars",
    ],
    [
      format(
        sumBy(projectRepos.value, (repo) => repo.watchers),
        true,
      ),
      "watchers",
    ],
    [
      format(
        sumBy(projectRepos.value, (repo) => repo.forks.length),
        true,
      ),
      "forks",
    ],
    [
      format(
        sumBy(projectRepos.value, (repo) => repo.issues.length),
        true,
      ),
      "issues",
    ],
    [
      format(
        sumBy(projectRepos.value, (repo) => repo.pullRequests.length),
        true,
      ),
      "pull requests",
    ],
    [
      format(
        sumBy(projectRepos.value, (repo) => repo.commits.length),
        true,
      ),
      "commits",
    ],
    [
      format(
        sumBy(projectRepos.value, (repo) => repo.contributors.length),
        true,
      ),
      "contributors",
    ],
  ],
  ["Analytics", `${format(analyticsProperties.value, true)} properties`],
]);

/** publication table row data */
const projectPublications = computed(() =>
  /** get publication matching this core project */
  publications
    .filter((publication) => publication.coreProject === id.value)
    .map((publication) => {
      /** look up journal matching this publication */
      const journal = journals.find(
        (journal) => journal.id === publication.journal,
      );
      /** include journal info */
      return {
        ...publication,
        year: publication.year,
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
    key: "relativeCitationRatio",
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
    key: "citationsPerYear",
    name: "Cit./year",
  },
  {
    key: "journal",
    name: "Journal",
    align: "left",
  },
  {
    slot: "year",
    key: "year",
    name: "Published",
  },
  {
    key: "modified",
    name: "Updated",
  },
];

/** publication chart data */
const publicationsOverTime = computed(() =>
  projectPublications.value.map(
    ({ year }) => [new Date(year || 2000, 0, 1), 1] as const,
  ),
);

/** repo table row data */
const projectRepos = computed(() =>
  repos
    .filter((repo) => repo.coreProject === id.value)
    .map((repo) => ({
      ...repo,
      modified: new Date(repo.modified),
      dependencyTotal: sum(Object.values(repo.dependencies)),
      ...repo.dependencies,
    })),
);

/** repo table column definitions */
const repoCols: Cols<typeof projectRepos.value> = [
  {
    slot: "owner",
    key: "owner",
    name: "Owner",
    align: "left",
  },
  {
    slot: "name",
    key: "name",
    name: "Name",
    align: "left",
  },
  {
    key: "description",
    name: "Description",
    align: "left",
    style: { width: "400px" },
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
    style: { whiteSpace: "nowrap" },
  },
  {
    key: "stars",
    name: "Stars",
  },
  {
    key: "forks",
    name: "Forks",
  },
  {
    key: "watchers",
    name: "Watchers",
  },
  {
    key: "commits",
    name: "Commits",
  },
  {
    key: "issues",
    slot: "issues",
    name: "Issues",
    style: { whiteSpace: "nowrap" },
  },
  {
    key: "pullRequests",
    slot: "pull-requests",
    name: "PRs",
    style: { whiteSpace: "nowrap" },
  },
  {
    slot: "issue-time-open",
    key: "issueTimeOpen",
    name: "Issue Avg",
  },
  {
    slot: "pull-request-time-open",
    key: "pullRequestTimeOpen",
    name: "PR Avg",
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
    key: "codeOfConduct",
    name: "Code of Con.",
  },
  {
    key: "license",
    name: "License",
  },
  {
    key: "contributors",
    name: "Contrib.",
  },
  {
    slot: "languages",
    key: "languages",
    name: "Languages",
    attrs: (row) => ({
      title: row?.languages
        .map(({ name, bytes }) => `${name}: ${bytes}`)
        .join("\n"),
    }),
  },
  {
    slot: "dependencies",
    key: "dependencyTotal",
    name: "Dependencies",
    attrs: (row) => ({
      title: printObject(row?.dependencies),
    }),
  },
];

/** star chart data */
const starsOverTime = computed(() =>
  projectRepos.value
    .map(({ stars }) => stars.map((star) => [new Date(star.date), 1] as const))
    .flat(),
);

/** fork chart data */
const forksOverTime = computed(() =>
  projectRepos.value
    .map(({ forks }) => forks.map((fork) => [new Date(fork.date), 1] as const))
    .flat(),
);

/** issue chart data */
const issuesOverTime = computed(() =>
  projectRepos.value
    .map(({ issues }) =>
      issues.map(({ created }) => [new Date(created), 1] as const),
    )
    .flat(),
);

/** issue chart data */
const pullRequestsOverTime = computed(() =>
  projectRepos.value
    .map(({ pullRequests }) =>
      pullRequests.map(({ created }) => [new Date(created), 1] as const),
    )
    .flat(),
);

/** commit chart data */
const commitsOverTime = computed(() =>
  projectRepos.value
    .map(({ commits }) =>
      commits.map((commit) => [new Date(commit.date), 1] as const),
    )
    .flat(),
);

/** analytics properties that match this project */
const analyticsProperties = computed(() =>
  analytics.filter((item) => match(item.coreProject, id.value ?? "")),
);

/** "over time" analytics data */
const overTimeAnalytics = computed(() => {
  /** all properties data */
  const properties = analyticsProperties.value.map((item) => item.overTime);
  /** list of metric keys */
  const metrics = uniq(
    analyticsProperties.value.map((item) => Object.keys(item.overTime)).flat(),
  ) as (keyof (typeof properties)[number])[];
  /** for each metric */
  return metrics.map((metric) => {
    const totals: Record<string, number> = {};
    /** sum properties together */
    for (const property of properties)
      for (const [date, value] of Object.entries(property[metric])) {
        totals[date] ??= 0;
        totals[date] += value;
      }
    return {
      metric,
      data: Object.entries(totals).map(
        ([d, value]) => [new Date(d), value] as const,
      ),
    };
  });
});

/** "top dimensions" analytics data */
const topAnalytics = computed(() => {
  const properties = analyticsProperties.value.map(
    ({ property, propertyName, coreProject, overTime, ...rest }) => rest,
  );

  type Property = Record<string, Record<string, Record<string, number>>>;

  /** total values from all properties */
  const total: Property = {};

  /** go through each property and total values */
  for (const property of properties as unknown as Property[])
    for (const [topKey, topValue] of getEntries(property))
      for (const [byKey, byValue] of getEntries(topValue))
        for (const [dimensionKey, dimensionValue] of getEntries(byValue)) {
          total[topKey] ??= {};
          total[topKey][byKey] ??= {};
          total[topKey][byKey][dimensionKey] ??= 0;
          total[topKey][byKey][dimensionKey] += dimensionValue;
        }

  /** sort and limit counts */
  for (const [topKey, topValue] of getEntries(total))
    for (const [byKey, byValue] of getEntries(topValue))
      total[topKey]![byKey] = Object.fromEntries(
        orderBy(Object.entries(byValue), (item) => item[1], "desc").slice(0, 5),
      );

  return total;
});
</script>
