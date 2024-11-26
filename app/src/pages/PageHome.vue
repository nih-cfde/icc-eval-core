<template>
  <section>
    <AppHeading level="1"><Home />Home</AppHeading>
  </section>

  <section>
    <AppHeading level="2"><Calculator />Totals</AppHeading>

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
            sum(coreProjects.map((row) => row.awardAmount)).toLocaleString(
              undefined,
              { style: "currency", currency: "USD" },
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
    <AppHeading level="2"><Chart />Over Time</AppHeading>

    <AppCheckbox v-model="cumulative">Cumulative</AppCheckbox>

    <div class="charts">
      <AppLineChart
        title="Projects Per Year"
        :data="projectsOverTime"
        :cumulative="cumulative"
      />

      <AppLineChart
        title="Award Amount Per Year"
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
        title="Publications Per Year"
        :data="publicationsOverTime"
        :cumulative="cumulative"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { sum, sumBy } from "lodash";
import Calculator from "@/assets/calculator.svg";
import Chart from "@/assets/chart.svg";
import Home from "@/assets/home.svg";
import AppCheckbox from "@/components/AppCheckbox.vue";
import AppHeading from "@/components/AppHeading.vue";
import AppLineChart from "@/components/AppLineChart.vue";
import { overTime } from "@/util/data";
import coreProjects from "~/core-projects.json";
import rawProjects from "~/projects.json";
import publications from "~/publications.json";

/** parse dates */
const projects = rawProjects.map((raw) => ({
  ...raw,
  dateStart: new Date(raw.dateStart),
}));

/** whether charts should be shown in cumulative mode */
const cumulative = ref(true);

/** chart number of projects over time */
const projectsOverTime = overTime(projects, (d) =>
  d.dateStart.getUTCFullYear(),
);

/** chart award amount over time */
const awardsOverTime = overTime(
  projects,
  (d) => d.dateStart.getUTCFullYear(),
  (d) => sumBy(d, "awardAmount"),
);

/** chart number of publications over time */
const publicationsOverTime = overTime(publications, "year");
</script>
