<template>
  <section>
    <h1><Microscope />Core Projects</h1>
  </section>

  <section>
    <AppTable
      :cols="cols"
      :rows="rows"
      :sort="[{ id: 'award_amount', desc: true }]"
    >
      <template #id="{ row }">
        <AppLink :to="`/core-project/${row.id}`">{{ row.id }}</AppLink>
      </template>

      <template #name="{ row }">
        {{ truncate(row.name, { length: 50 }) }}
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
    </AppTable>
  </section>
</template>

<script setup lang="ts">
import { truncate } from "lodash";
import Microscope from "@/assets/microscope.svg";
import AppLink from "@/components/AppLink.vue";
import AppTable, { type Cols } from "@/components/AppTable.vue";
import coreProjects from "~/core-projects.json";

/** table row data */
const rows = coreProjects;

/** table column definitions */
const cols: Cols<typeof rows> = [
  {
    slot: "id",
    key: "id",
    name: "ID",
    align: "left",
  },
  {
    slot: "name",
    key: "name",
    name: "Name",
    align: "left",
  },
  {
    key: "activity_code",
    name: "Activity Code",
  },
  {
    key: "projects",
    name: "Projects",
  },
  {
    slot: "award-amount",
    key: "award_amount",
    name: "Award",
    attrs: { title: "Total award amount across all projects" },
  },
  {
    key: "publications",
    name: "Publications",
  },
  {
    key: "repos",
    name: "Repositories",
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
