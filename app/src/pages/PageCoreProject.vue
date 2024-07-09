<template>
  <section>
    <h1><Microscope />Core Project {{ id }}</h1>
  </section>

  <section>
    <h2>Details</h2>

    <div class="mini-table">
      <div>
        <span>Projects</span>
        <span>
          <template
            v-for="(project, _index) of coreProject.projects"
            :key="_index"
          >
            {{ project }}<br />
          </template>
        </span>
      </div>

      <div>
        <span>Name</span>
        <span>{{ coreProject.name }}</span>
      </div>

      <div>
        <span>Award</span>
        <span>
          {{
            coreProject.award_amount.toLocaleString(undefined, {
              style: "currency",
              currency: "USD",
            })
          }}
        </span>
      </div>

      <div>
        <span>Publications</span>
        <span>{{ projectPublications.length.toLocaleString() }}</span>
      </div>

      <div>
        <span>Software</span>
        <span>
          {{ projectRepos.length.toLocaleString() }} repositories<br />
          <template v-if="projectRepos.length">
            {{
              sumBy(
                projectRepos,
                (repo) => repo.commits.length,
              ).toLocaleString()
            }}
            commits<br />
            {{
              sumBy(projectRepos, (repo) => repo.stars.length).toLocaleString()
            }}
            stars<br />
            {{ sumBy(projectRepos, "watchers").toLocaleString() }}
            watchers<br />
            {{
              sumBy(projectRepos, (repo) => repo.forks.length).toLocaleString()
            }}
            forks<br />
            {{ sumBy(projectRepos, "issues").toLocaleString() }} open issues<br />
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

    <AppTable :cols="repoCols" :rows="projectRepos">
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
    </AppTable>

    <AppCheckbox v-model="cumulative">Cumulative</AppCheckbox>

    <div class="charts">
      <AppLineChart
        class="chart"
        :title="cumulative ? 'Cumulative Commits' : 'Commits Per Year'"
        :data="commitsOverTime"
        :cumulative="cumulative"
      />
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
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { sumBy } from "lodash";
import { useTitle } from "@vueuse/core";
import Microscope from "@/assets/microscope.svg";
import AppCheckbox from "@/components/AppCheckbox.vue";
import AppLineChart from "@/components/AppLineChart.vue";
import AppLink from "@/components/AppLink.vue";
import AppTable, { type Cols } from "@/components/AppTable.vue";
import { carve } from "@/util/array";
import { overTime } from "@/util/data";
import { ago } from "@/util/string";
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
        year: String(publication.year),
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
  overTime(
    publications.filter((publication) => publication.core_project === id.value),
    "year",
  ),
);

/** repo table row data */
const projectRepos = computed(() =>
  repos
    .filter((repo) => repo.core_project === id.value)
    .map((repo) => ({ ...repo, modified: new Date(repo.modified) })),
);

/** repo table column definitions */
const repoCols: Cols<typeof projectRepos.value> = [
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
    key: "commits",
    name: "Commits",
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
    key: "issues",
    name: "Open Issues",
  },
  {
    slot: "modified",
    key: "modified",
    name: "Updated",
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
];

/** commit chart data */
const commitsOverTime = computed(() =>
  overTime(
    repos
      .filter((repo) => repo.core_project === id.value)
      .map((repo) => repo.commits)
      .flat(),
    (d) => new Date(d).getUTCFullYear(),
  ),
);

/** star chart data */
const starsOverTime = computed(() =>
  overTime(
    repos
      .filter((repo) => repo.core_project === id.value)
      .map((repo) => repo.stars)
      .flat(),
    (d) => new Date(d).getUTCFullYear(),
  ),
);

/** fork chart data */
const forksOverTime = computed(() =>
  overTime(
    repos
      .filter((repo) => repo.core_project === id.value)
      .map((repo) => repo.forks)
      .flat(),
    (d) => new Date(d).getUTCFullYear(),
  ),
);
</script>
