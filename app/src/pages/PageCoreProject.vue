<template>
  <section>
    <h2><Microscope />Core Project {{ coreProject }}</h2>
  </section>

  <section>
    <div class="mini-table">
      <span>Projects</span>
      <span>{{ coreProjects[coreProject].projects.join(", ") }}</span>
      <span>Award</span>
      <span>{{
        coreProjects[coreProject].award_amount.toLocaleString(undefined, {
          style: "currency",
          currency: "USD",
        })
      }}</span>
    </div>

    <h3><Book />Publications ({{ rows.length.toLocaleString() }})</h3>

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

    <AppButton :to="`/pdfs/${coreProject}.pdf`" download target="_blank"
      >PDF<Download
    /></AppButton>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { truncate } from "lodash";
import { useTitle } from "@vueuse/core";
import Book from "@/assets/book.svg";
import Download from "@/assets/download.svg";
import Microscope from "@/assets/microscope.svg";
import AppButton from "@/components/AppButton.vue";
import AppLink from "@/components/AppLink.vue";
import AppTable, { type Cols } from "@/components/AppTable.vue";
import coreProjects from "@/data/core-projects.json";
import publicationsPerCoreProject from "@/data/publications-per-core-project.json";
import { carve } from "@/util/array";

const { params } = useRoute();

/** currently viewed core project */
const coreProject = computed(
  () =>
    (Array.isArray(params.id)
      ? params.id[0]
      : params.id) as keyof typeof publicationsPerCoreProject,
);

/** set tab title */
const { VITE_TITLE } = import.meta.env;
useTitle(computed(() => `${coreProject.value} | ${VITE_TITLE}`));

/** convert data from object to array */
const rows = computed(
  () => publicationsPerCoreProject[coreProject.value] ?? [],
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
</script>
