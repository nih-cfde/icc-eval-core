<template>
  <section>
    <AppHeading level="1"><Microscope />Core Projects</AppHeading>
  </section>

  <section>
    <p>Top-level, "core" projects in CFDE</p>

    <AppTable
      :cols="cols"
      :rows="rows"
      :sort="[{ id: 'reposAnalytics', desc: true }]"
    >
      <template #reposAnalytics="{ row }">
        <template v-if="row.repos || row.analytics">
          <AppLink
            :to="readmeLink"
            class="score good"
            title="Owners have completed the submission process"
          >
            <Check />
          </AppLink>
        </template>
        <template v-else>
          <AppLink
            :to="readmeLink"
            title="Owners have NOT completed the submission process"
            class="score bad"
          >
            <Xmark />
          </AppLink>
        </template>
      </template>

      <template #id="{ row }">
        <AppLink :to="`/core-project/${row.id}`">{{ row.id }}</AppLink>
      </template>

      <template #name="{ row }">
        {{ row.name }}
      </template>

      <template #award-amount="{ row }">
        {{
          format(row.awardAmount, true, {
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
import Check from "@/assets/check.svg";
import Microscope from "@/assets/microscope.svg";
import Xmark from "@/assets/xmark.svg";
import AppHeading from "@/components/AppHeading.vue";
import AppLink from "@/components/AppLink.vue";
import AppTable, { type Cols } from "@/components/AppTable.vue";
import { format } from "@/util/string";
import coreProjects from "~/core-projects.json";

const readmeLink =
  "https://github.com/nih-cfde/icc-eval-core?tab=readme-ov-file#submit-your-project";

/** table row data */
const rows = coreProjects.map((d) => ({
  ...d,
  reposAnalytics: d.repos + d.analytics,
}));

/** table column definitions */
const cols: Cols<typeof rows> = [
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
  {
    slot: "reposAnalytics",
    key: "reposAnalytics",
    name: "Rep./Anal.",
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

.score > svg {
  height: 1.5em;
}

.score:hover {
  background: unset;
  color: black;
}

.good {
  color: var(--success);
}

.bad {
  color: var(--light-gray);
}
</style>
