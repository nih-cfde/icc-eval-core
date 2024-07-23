<template>
  <section>
    <h1><Microscope />Core Project {{ id }}</h1>
  </section>

  <section>
    <h2>Details</h2>

    <div class="mini-table">
      <div v-for="([name, ...detail], _index) in details" :key="_index">
        <span>{{ name }}</span>
        <span>
          <template v-for="(line, __index) of detail" :key="__index">
            <template v-if="!(Array.isArray(line) && line[0] === '0')">
              {{ [line].flat().join(" ") }}
              <br />
            </template>
          </template>
        </span>
      </div>
    </div>
  </section>

  <section>
    <h2>Publications</h2>

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
        <template
          v-for="(author, _index) of carve(row.authors, 2)"
          :key="_index"
        >
          {{ author }}<br />
        </template>
      </template>

      <template #modified="{ row }">
        {{ row.modified.toLocaleString(undefined, { dateStyle: "medium" }) }}
        <br />
        ({{ ago(row.modified) }})
      </template>
    </AppTable>

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

  <section>
    <h2>Repositories</h2>

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
        {{ row.closed_issues.toLocaleString() }} ☑<br />
        {{ row.open_issues.toLocaleString() }} ☐<br />
      </template>

      <template #pull-requests="{ row }">
        {{ row.closed_pull_requests.toLocaleString() }} ☑<br />
        {{ row.open_pull_requests.toLocaleString() }} ☐<br />
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

      <template #issues="{ row }">
        {{ row.open_issues.toLocaleString() }} open<br />
        {{ row.closed_issues.toLocaleString() }} closed<br />
      </template>

      <template #pull-requests="{ row }">
        {{ row.open_pull_requests.toLocaleString() }} open<br />
        {{ row.closed_pull_requests.toLocaleString() }} closed<br />
      </template>

      <template #modified="{ row }">
        {{ row.modified.toLocaleString(undefined, { dateStyle: "medium" }) }}
        <br />
        ({{ ago(row.modified) }})
      </template>
    </AppTable>

    <div class="mini-table">
      <div>
        <span>PR</span>
        <span>Pull (change) request</span>
      </div>
      <div>
        <span>Issue/PR Open</span>
        <span
          >Average time issues/pull requests stay open for before being
          closed</span
        >
      </div>
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
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { sum, sumBy } from "lodash";
import { useTitle } from "@vueuse/core";
import Microscope from "@/assets/microscope.svg";
import AppCheckbox from "@/components/AppCheckbox.vue";
import AppLineChart from "@/components/AppLineChart.vue";
import AppLink from "@/components/AppLink.vue";
import AppTable, { type Cols } from "@/components/AppTable.vue";
import { carve } from "@/util/array";
import { overTime } from "@/util/data";
import { ago, span } from "@/util/string";
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
    "Software",
    [projectRepos.value.length.toLocaleString(), "repositories"],
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
    attrs: { title: "Relative Citation Ratio" },
  },
  {
    key: "rank",
    name: "SJR",
    attrs: { title: "Scimago Journal Rank" },
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
    slot: "modified",
    key: "modified",
    name: "Updated",
  },
  {
    key: "issue_time_open",
    name: "Issue Open",
  },
  {
    key: "pull_request_time_open",
    name: "PR Open",
  },
  {
    key: "language",
    name: "Language",
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
      title: Object.entries(row?.dependencies ?? {})
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n"),
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
</script>
