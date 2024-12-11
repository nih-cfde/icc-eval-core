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
      <AppTimeChart
        title="Projects"
        :data="projectsOverTime"
        :cumulative="cumulative"
        by="month"
        group="group"
      />

      <AppTimeChart
        title="Award Amount"
        :data="awardsOverTime"
        :cumulative="cumulative"
        :y-format="
          (value: number) =>
            value.toLocaleString(undefined, {
              style: 'currency',
              currency: 'USD',
              notation: 'compact',
            })
        "
        by="month"
        group="group"
      />

      <AppTimeChart
        title="Publications"
        :data="publicationsOverTime"
        :cumulative="cumulative"
        by="year"
        group="group"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { sum } from "lodash";
import Calculator from "@/assets/calculator.svg";
import Chart from "@/assets/chart.svg";
import Home from "@/assets/home.svg";
import AppCheckbox from "@/components/AppCheckbox.vue";
import AppHeading from "@/components/AppHeading.vue";
import AppTimeChart from "@/components/AppTimeChart.vue";
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
const projectsOverTime = projects.map(
  ({ dateStart }) => [dateStart, 1] as const,
);

/** chart award amount over time */
const awardsOverTime = projects.map(
  ({ dateStart, awardAmount }) => [dateStart, awardAmount] as const,
);

/** chart number of publications over time */
const publicationsOverTime = publications.map(
  ({ year }) => [new Date(year, 0, 1), 1] as const,
);
</script>
