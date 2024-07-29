<template>
  <section>
    <h1>Home</h1>
  </section>

  <section>
    <h2>Totals</h2>

    <dl class="details">
      <div>
        <dt>Core Projects</dt>
        <dd>
          {{ coreProjects.length.toLocaleString() }}
        </dd>
      </div>

      <div>
        <dt>Projects</dt>
        <dd>
          {{
            sum(coreProjects.map((row) => row.projects.length)).toLocaleString()
          }}
        </dd>
      </div>

      <div>
        <dt>Awards</dt>
        <dd>
          {{
            sum(coreProjects.map((row) => row.award_amount)).toLocaleString(
              undefined,
              {
                style: "currency",
                currency: "USD",
              },
            )
          }}
        </dd>
      </div>

      <div>
        <dt>Publications</dt>
        <dd>
          {{
            sum(coreProjects.map((row) => row.publications)).toLocaleString()
          }}
        </dd>
      </div>
    </dl>
  </section>

  <section>
    <h2>Over Time</h2>

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
import { sum, sumBy } from "lodash";
import AppCheckbox from "@/components/AppCheckbox.vue";
import AppLineChart from "@/components/AppLineChart.vue";
import { overTime } from "@/util/data";
import coreProjects from "~/core-projects.json";
import rawProjects from "~/projects.json";
import publications from "~/publications.json";

/** parse dates */
const projects = rawProjects.map((raw) => ({
  ...raw,
  date_start: new Date(raw.date_start),
}));

/** whether charts should be shown in cumulative mode */
const cumulative = ref(true);

/** chart number of projects over time */
const projectsOverTime = overTime(projects, (d) =>
  d.date_start.getUTCFullYear(),
);

/** chart award amount over time */
const awardsOverTime = overTime(
  projects,
  (d) => d.date_start.getUTCFullYear(),
  (d) => sumBy(d, "award_amount"),
);

/** chart number of publications over time */
const publicationsOverTime = overTime(publications, "year");
</script>
