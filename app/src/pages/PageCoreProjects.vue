<template>
  <section>
    <h2><Microscope />Core Projects</h2>
  </section>

  <section>
    <AppTable
      :cols="cols"
      :rows="rows"
      :sort="[{ id: 'award_amount', desc: true }]"
    >
      <template #id="{ row }">
        <RouterLink :to="`/core-project/${row.id}`">{{ row.id }}</RouterLink>
      </template>

      <template #projects="{ row }">
        {{ row.projects.length.toLocaleString() }}
      </template>

      <template #award-amount="{ row }">
        {{
          row.award_amount.toLocaleString(undefined, {
            style: "currency",
            currency: "USD",
            notation: "compact",
          })
        }}
      </template>

      <template #publications="{ row }">
        {{ row.publications.toLocaleString() }}
      </template>
    </AppTable>
  </section>
</template>

<script setup lang="ts">
import Microscope from "@/assets/microscope.svg";
import AppTable, { type Cols } from "@/components/AppTable.vue";
import coreProjects from "@/data/core-projects.json";

/** convert data from object to array */
const rows = Object.entries(coreProjects).map(([id, rest]) => ({
  id,
  ...rest,
}));

/** table column definitions */
const cols: Cols<typeof rows> = [
  {
    slot: "id",
    key: "id",
    name: "ID",
  },
  {
    slot: "projects",
    key: "projects",
    name: "Projects",
    style: { justifyContent: "center" },
  },
  {
    slot: "award-amount",
    key: "award_amount",
    name: "Award",
    style: { justifyContent: "center" },
    attrs: { title: "Total award amount across all projects" },
  },
  {
    slot: "publications",
    key: "publications",
    name: "Publications",
    style: { justifyContent: "center" },
  },
];
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, 120px);
  place-content: center;
  place-items: center;
  width: 100%;
  gap: 10px;
}
</style>
