<template>
  <section>
    <h2><Microscope />Project: {{ project }}</h2>

    <h3><Book />Publications</h3>

    <AppTable
      :cols="cols"
      :rows="rows"
      :sort="[{ id: 'relative_citation_ratio', desc: true }]"
    >
      <template #id="{ row }">
        <span>
          <a
            :href="`https://pubmed.ncbi.nlm.nih.gov/${row.id}`"
            target="_blank"
          >
            {{ row.id }}
          </a>
          <br />
          <a :href="`https://doi.org/${row.doi}`" target="_blank">DOI</a>
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
        {{ carve(row.authors, 2).join(", ") }}
      </template>
      <template #modified="{ row }">
        {{
          new Date(row.modified).toLocaleString(undefined, {
            dateStyle: "medium",
          })
        }}
      </template>
    </AppTable>

    <AppButton :to="`/pdfs/${project}.pdf`" download target="_blank"
      >PDF<Download
    /></AppButton>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { truncate } from "lodash";
import Book from "@/assets/book.svg";
import Download from "@/assets/download.svg";
import Microscope from "@/assets/microscope.svg";
import AppButton from "@/components/AppButton.vue";
import AppTable, { type Cols } from "@/components/AppTable.vue";
import projects from "@/data/publications-per-core-project.json";
import { carve } from "@/util/array";

const { params } = useRoute();

const project = computed(
  () =>
    (Array.isArray(params.project)
      ? params.project[0]
      : params.project) as keyof typeof projects,
);

const rows = computed(() => projects[project.value]);

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
