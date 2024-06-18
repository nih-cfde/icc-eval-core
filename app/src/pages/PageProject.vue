<template>
  <section>
    <h2>Project: {{ project }}</h2>

    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>PMID</th>
            <th>DOI</th>
            <th>RCR</th>
            <th>Total Citations</th>
            <th>Citations Per Year</th>
            <th>Title</th>
            <th>Authors</th>
            <th>Journal</th>
            <th>Published</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) of datum" :key="index">
            <td>{{ row.id }}</td>
            <td>{{ row.doi }}</td>
            <td>{{ row.relative_citation_ratio }}</td>
            <td>{{ row.citations.toLocaleString() }}</td>
            <td>{{ row.citations_per_year.toLocaleString() }}</td>
            <td>{{ truncate(row.title, { length: 20 }) }}</td>
            <td>{{ carve(row.authors, 5).join(", ") }}</td>
            <td>{{ row.journal }}</td>
            <td>{{ row.year }}</td>
            <td>
              {{
                new Date(row.modified).toLocaleString(undefined, {
                  dateStyle: "medium",
                })
              }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AppButton :to="`/pdfs/${project}.pdf`" download>PDF<Download /></AppButton>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { orderBy, truncate } from "lodash";
import Download from "@/assets/download.svg";
import AppButton from "@/components/AppButton.vue";
import data from "@/data/publications-per-core-project.json";
import { carve } from "@/util/array";

const { params } = useRoute();

const project = computed(
  () =>
    (Array.isArray(params.project)
      ? params.project[0]
      : params.project) as keyof typeof data,
);

const datum = computed(() =>
  orderBy(data[project.value] ?? [], ["relative_citation_ratio"], ["desc"]),
);
</script>
