<template>
  <section>
    <AppHeading level="1"><Home />Home</AppHeading>
  </section>

  <section>
    <AppHeading level="2"><Calculator />Totals</AppHeading>

    <p>CFDE-wide stats</p>

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

    <p>How CFDE stats have changed over time</p>

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

    <AppCheckbox v-model="cumulative">Cumulative</AppCheckbox>
  </section>

  <section>
    <AppHeading level="2"><Code />Repositories</AppHeading>

    <p>CFDE-wide software repository stats</p>

    <dl v-if="repoOverview.repos" class="details">
      <div
        v-for="(repoValue, repoProp, repoIndex) in repoOverview"
        :key="repoIndex"
        :style="{
          gridColumn: typeof repoValue === 'number' ? 'span 1' : 'span 2',
        }"
      >
        <dt>{{ startCase(repoProp) }}</dt>
        <dd v-if="typeof repoValue === 'number'">
          {{ repoValue.toLocaleString(undefined, { notation: "compact" }) }}
        </dd>
        <dd v-else class="mini-table">
          <template
            v-for="([entryName, entryCount], entryIndex) of Object.entries(
              repoValue,
            ).slice(0, 5)"
            :key="entryIndex"
          >
            <span>{{ entryName || "none" }}</span>
            <span>
              {{
                (repoProp === "languages"
                  ? entryCount / 160
                  : entryCount
                ).toLocaleString(undefined, { notation: "compact" })
              }}
            </span>
          </template>
        </dd>
      </div>
    </dl>

    <div class="col">
      <AppHeading level="3">Notes</AppHeading>

      <ul>
        <li>
          <code>contributors</code> are unique users that have committed, opened
          an issue, or otherwise participated in the repo.
        </li>
        <li>
          <code>language</code> lines of code estimated from
          <code>bytes / 160</code> (UTF-8, ~2 bytes per char, ~80 chars per
          line).
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { startCase, sum } from "lodash";
import Calculator from "@/assets/calculator.svg";
import Chart from "@/assets/chart.svg";
import Code from "@/assets/code.svg";
import Home from "@/assets/home.svg";
import AppCheckbox from "@/components/AppCheckbox.vue";
import AppHeading from "@/components/AppHeading.vue";
import AppTimeChart from "@/components/AppTimeChart.vue";
import { date } from "@/util/date";
import coreProjects from "~/core-projects.json";
import rawProjects from "~/projects.json";
import publications from "~/publications.json";
import repoOverview from "~/repo-overview.json";

/** parse dates */
const projects = rawProjects.map((raw) => ({
  ...raw,
  dateStart: date(raw.dateStart),
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
