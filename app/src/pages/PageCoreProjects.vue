<template>
  <section>
    <AppHeading level="1"><Microscope />Core Projects</AppHeading>
  </section>

  <section>
    <AppTable
      :cols="cols"
      :rows="rows"
      :sort="[{ id: 'awardAmount', desc: true }]"
    >
      <template #status="{ row }">
        <template v-if="row.repos || row.analytics">
          <div title="Owners have completed the submission process">
            <Check class="icon good" />
          </div>
        </template>
        <template v-else>
          <div title="Owners have NOT completed the submission process">
            <Xmark class="icon bad" />
          </div>
        </template>
      </template>

      <template #id="{ row }">
        <AppLink :to="`/core-project/${row.id}`">{{ row.id }}</AppLink>
      </template>

      <template #name="{ row }">
        {{ truncate(row.name, { length: 50 }) }}
      </template>

      <template #award-amount="{ row }">
        {{
          row.awardAmount.toLocaleString(undefined, {
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
import Check from "@/assets/check.svg";
import Microscope from "@/assets/microscope.svg";
import Xmark from "@/assets/xmark.svg";
import AppHeading from "@/components/AppHeading.vue";
import AppLink from "@/components/AppLink.vue";
import AppTable, { type Cols } from "@/components/AppTable.vue";
import coreProjects from "~/core-projects.json";

/** table row data */
const rows = coreProjects.map((d) => ({ ...d, status: d.repos + d.analytics }));

/** table column definitions */
const cols: Cols<typeof rows> = [
  {
    slot: "status",
    key: "status",
    name: "Status",
  },
  {
    slot: "id",
    key: "id",
    name: "ID",
    align: "left",
    style: { whiteSpace: "nowrap" },
  },
  {
    slot: "name",
    key: "name",
    name: "Name",
    align: "left",
  },
  {
    key: "activityCode",
    name: "Activity Code",
  },
  {
    key: "projects",
    name: "Projects",
  },
  {
    slot: "award-amount",
    key: "awardAmount",
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
  {
    key: "analytics",
    name: "Analytics",
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

.icon {
  height: 1.5em;
}

.good {
  color: var(--success);
}

.bad {
  color: var(--light-gray);
}
</style>
