<template>
  <section>
    <h1>Home</h1>
  </section>

  <section>
    <h3>Totals</h3>

    <div class="mini-table">
      <span>Core Projects</span>
      <span>
        {{ coreProjects.length.toLocaleString() }}
      </span>

      <span>Projects</span>
      <span>
        {{
          sum(coreProjects.map((row) => row.projects.length)).toLocaleString()
        }}
      </span>

      <span>Awards</span>
      <span>
        {{
          sum(coreProjects.map((row) => row.award_amount)).toLocaleString(
            undefined,
            {
              style: "currency",
              currency: "USD",
            },
          )
        }}
      </span>

      <span>Publications</span>
      <span>
        {{ sum(coreProjects.map((row) => row.publications)).toLocaleString() }}
      </span>
    </div>

    <h3>Over Time</h3>

    <AppCheckbox v-model="cumulative">Cumulative</AppCheckbox>

    <div class="charts">
      <AppLineChart
        :title="cumulative ? 'Cumulative Projects' : 'Projects Per Year'"
        :data="projectsOverTime"
        :cumulative="cumulative"
      />

      <AppLineChart
        :title="
          cumulative ? 'Cumulative Award Amount' : 'Award Amount Per Year'
        "
        :data="awardsOverTime"
        :cumulative="cumulative"
        :y-format="
          (value) =>
            value.toLocaleString(undefined, {
              style: 'currency',
              currency: 'USD',
              notation: 'compact',
            })
        "
      />

      <AppLineChart
        :title="
          cumulative ? 'Cumulative Publications' : 'Publications Per Year'
        "
        :data="publicationsOverTime"
        :cumulative="cumulative"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { groupBy, map, max, min, range, sum, sumBy } from "lodash";
import AppCheckbox from "@/components/AppCheckbox.vue";
import AppLineChart from "@/components/AppLineChart.vue";
import coreProjects from "~/core-projects.json";
import rawProjects from "~/projects.json";
import publications from "~/publications.json";

/** parse dates */
const projects = rawProjects.map((raw) => ({
  ...raw,
  date_start: new Date(raw.date_start),
}));

/** get project year */
const byYear = (project: (typeof projects)[number]) =>
  project.date_start.getUTCFullYear();

/** get extent of project dates */
const firstProjectYear = min(map(projects, byYear)) ?? 1900;
const lastProjectYear = max(map(projects, byYear)) ?? 2100;

/** get extent of publication dates */
const firstPublicationYear = min(map(publications, "year")) ?? 1900;
const lastPublicationYear = max(map(publications, "year")) ?? 2100;

/** group data by year */
const projectsPerYear = groupBy(projects, byYear);
const publicationsPerYear = groupBy(publications, "year");

/** whether charts should be shown in cumulative mode */
const cumulative = ref(true);

/** chart number of projects over time */
const projectsOverTime = Object.fromEntries(
  range(firstProjectYear, lastProjectYear + 1).map((year) => [
    year,
    projectsPerYear[year]?.length ?? 0,
  ]),
);

/** chart award amount over time */
const awardsOverTime = Object.fromEntries(
  range(firstProjectYear, lastProjectYear + 1).map((year) => [
    year,
    sumBy(projectsPerYear[year], "award_amount"),
  ]),
);

/** chart number of publications over time */
const publicationsOverTime = Object.fromEntries(
  range(firstPublicationYear, lastPublicationYear + 1).map((year) => [
    year,
    publicationsPerYear[year]?.length ?? 0,
  ]),
);
</script>
