<template>
  <section>
    <h1><Microscope />Core Project {{ id }}</h1>
  </section>

  <section>
    <h3>Details</h3>

    <div class="mini-table">
      <div>
        <span>Name</span>
        <span>{{ coreProject.name }}</span>
      </div>
      <div>
        <span>Projects</span>
        <span>{{ coreProject.projects.join(", ") }}</span>
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
        <span>{{ publications.length.toLocaleString() }}</span>
      </div>
    </div>

    <h3>Publications</h3>

    <AppTable
      :cols="cols"
      :rows="rows"
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

      <template #citations="{ row }">
        {{ row.citations.toLocaleString() }}
      </template>
      <template #citations_per_year="{ row }">
        {{ row.citations_per_year.toLocaleString() }}
      </template>
      <template #title="{ row }">
        {{ truncate(row.title, { length: 40 }) }}
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
        {{
          new Date(row.modified).toLocaleString(undefined, {
            dateStyle: "medium",
          })
        }}
      </template>
    </AppTable>

    <AppCheckbox v-model="cumulative">Cumulative</AppCheckbox>

    <AppLineChart
      class="chart"
      :title="cumulative ? 'Cumulative Publications' : 'Publications Per Year'"
      :data="publicationsOverTime"
      :cumulative="cumulative"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { truncate } from "lodash";
import { useTitle } from "@vueuse/core";
import Microscope from "@/assets/microscope.svg";
import AppCheckbox from "@/components/AppCheckbox.vue";
import AppLineChart from "@/components/AppLineChart.vue";
import AppLink from "@/components/AppLink.vue";
import AppTable, { type Cols } from "@/components/AppTable.vue";
import { carve } from "@/util/array";
import { overTime } from "@/util/data";
import coreProjects from "~/core-projects.json";
import journals from "~/journals.json";
import publications from "~/publications.json";

const { params } = useRoute();

/** whether charts should be shown in cumulative mode */
const cumulative = ref(true);

/** currently viewed core project id */
const id = computed(() =>
  Array.isArray(params.id) ? params.id[0] : params.id,
);

/** set tab title */
const { VITE_TITLE } = import.meta.env;
useTitle(computed(() => `${id.value} | ${VITE_TITLE}`));

/** currently viewed core project (details) */
const coreProject = computed(
  () => coreProjects.find((coreProject) => coreProject.id === id.value)!,
);

/** table row data */
const rows = computed(() =>
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
        rank: journal?.rank ?? 0,
        journal: journal?.name ?? publication.journal,
      };
    }),
);

/** table column definitions */
const cols: Cols<typeof rows.value> = [
  {
    slot: "id",
    key: "id",
    name: "ID",
    style: { whiteSpace: "nowrap" },
  },
  {
    key: "relative_citation_ratio",
    name: "RCR",
    style: { justifyContent: "center" },
    attrs: { title: "Relative Citation Ratio" },
  },
  {
    key: "rank",
    name: "SJR",
    style: { justifyContent: "center" },
    attrs: { title: "Scimago Journal Rank" },
  },
  {
    slot: "citations",
    key: "citations",
    name: "Citations",
    style: { justifyContent: "center" },
  },
  {
    slot: "citations_per_year",
    key: "citations_per_year",
    name: "Cit./year",
    style: { justifyContent: "center" },
  },
  {
    slot: "title",
    key: "title",
    name: "Title",
  },
  {
    slot: "authors",
    key: "authors",
    name: "Authors",
  },
  {
    key: "journal",
    name: "Journal",
  },
  {
    key: "year",
    name: "Published",
    style: { justifyContent: "center" },
  },
  {
    slot: "modified",
    key: "modified",
    name: "Updated",
    style: { justifyContent: "center" },
  },
];

const publicationsOverTime = computed(() =>
  overTime(
    publications.filter((publication) => publication.core_project === id.value),
    "year",
    (d) => d.length,
  ),
);
</script>
