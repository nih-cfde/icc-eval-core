<template>
  <section>
    <AppHeading level="1"><Home />Home</AppHeading>
  </section>

  <!-- overview -->
  <section>
    <AppHeading level="2"><Eye />Overview</AppHeading>

    <p>High-level info about the CFDE program.</p>

    <dl class="details">
      <div>
        <dt>Core Projects</dt>
        <dd>
          {{ format(coreProjects, true) }}
        </dd>
      </div>

      <div>
        <dt>Projects</dt>
        <dd>
          {{
            format(sum(coreProjects?.map((row) => row.projects.length)), true)
          }}
        </dd>
      </div>

      <div>
        <dt>Awards</dt>
        <dd>
          {{
            format(sum(coreProjects?.map((row) => row.awardAmount)), true, {
              style: "currency",
              currency: "USD",
            })
          }}
        </dd>
      </div>

      <div>
        <dt>Publications</dt>
        <dd>
          {{ format(sum(coreProjects?.map((row) => row.publications)), true) }}
        </dd>
      </div>
    </dl>
  </section>

  <!-- over time -->
  <section>
    <AppHeading level="2"><Chart />Over Time</AppHeading>

    <p>How CFDE stats have changed over time.</p>

    <div class="charts">
      <AppTimeChart
        title="Projects"
        :data="projectsOverTime"
        :cumulative="cumulative"
        by="month"
        group="group"
      />

      <AppTimeChart
        title="Award Amount (by fiscal year)"
        :data="awardsOverTime"
        :cumulative="cumulative"
        :y-format="
          (value: number) =>
            format(value, true, {
              style: 'currency',
              currency: 'USD',
              notation: 'compact',
            })
        "
        by="year"
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

  <!-- publications -->
  <section>
    <AppHeading level="2"><Book />Publications</AppHeading>

    <p>Latest CFDE published works.</p>

    <AppTable
      :cols="publicationCols"
      :rows="publications ?? []"
      :sort="[{ id: 'year', desc: true }]"
    >
      <template #id="{ row }">
        <span>
          <AppLink :to="`https://pubmed.ncbi.nlm.nih.gov/${row.id}`">
            {{ row.id }}
          </AppLink>
          <br />
          <AppLink :to="`https://doi.org/${row.doi}`">DOI</AppLink>
        </span>
      </template>

      <template #project="{ row }">
        <AppLink
          v-if="row.coreProject"
          :to="`/core-project/${row.coreProject}`"
        >
          {{ row.coreProject }}
        </AppLink>
      </template>

      <template #authors="{ row }">
        <template v-for="(author, index) of carve(row.authors, 2)" :key="index">
          {{ author }}
          <br />
        </template>
      </template>

      <template #year="{ row }">{{ row.year }}</template>
    </AppTable>

    <div class="col">
      <AppHeading level="3">Notes</AppHeading>

      <dl class="mini-table">
        <dt>RCR</dt>
        <dd>
          <AppLink to="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5012559/">
            Relative Citation Ratio
          </AppLink>
        </dd>
        <dt>SJR</dt>
        <dd>
          <AppLink to="https://www.scimagojr.com/journalrank.php">
            Scimago Journal Rank
          </AppLink>
        </dd>
      </dl>
    </div>
  </section>

  <!-- repositories -->
  <section>
    <AppHeading level="2"><Code />Repositories</AppHeading>

    <p>High-level info about CFDE software repositories.</p>

    <p v-if="repositoriesOverview === notAuthed" class="error">
      Sorry, you're not authorized to view this data
    </p>

    <dl v-else class="details">
      <div
        v-for="(value, key, index) in repositoriesOverview"
        :key="index"
        :style="{
          gridColumn: typeof value === 'number' ? 'span 1' : 'span 2',
        }"
      >
        <dt>{{ startCase(key) }}</dt>
        <dd v-if="typeof value === 'number'">
          {{ format(value, true) }}
        </dd>
        <dd v-else class="mini-table">
          <template
            v-for="([key, _value], index) of Object.entries(value).slice(0, 5)"
            :key="index"
          >
            <span>{{ key || "none" }}</span>
            <span>
              {{ format(key === "languages" ? bytes(_value) : _value, true) }}
            </span>
          </template>
        </dd>
      </div>
    </dl>
  </section>

  <!-- analytics -->
  <section>
    <AppHeading level="2"><Chart />Analytics</AppHeading>

    <p>High-level info about CFDE website usage.</p>

    <p v-if="analyticsOverview === notAuthed" class="error">
      Sorry, you're not authorized to view this data
    </p>

    <template v-else>
      <div class="charts">
        <template
          v-for="(data, metric, index) in analyticsOverview?.overTime"
          :key="index"
        >
          <AppTimeChart
            :title="startCase(metric)"
            :data="
              Object.entries(data).map(([date, value]) => [
                new Date(date),
                value,
              ])
            "
            :cumulative="cumulative"
            by="week"
            group="group"
          />
        </template>
      </div>

      <AppCheckbox v-model="cumulative">Cumulative</AppCheckbox>

      <dl class="details">
        <template
          v-for="(metrics, dimension) in omit(analyticsOverview, 'overTime')"
          :key="dimension"
        >
          <div
            v-if="typeof metrics === 'object' && 'engagedSessions' in metrics"
          >
            <dt>{{ startCase(dimension) }}</dt>
            <dd class="mini-table">
              <template
                v-for="[key, value] in Object.entries(
                  metrics.engagedSessions,
                ).slice(0, 5)"
                :key="key"
              >
                <span>
                  {{ key || "none" }}
                </span>
                <span>
                  {{ format(value, true) }}
                </span>
              </template>
            </dd>
          </div>
        </template>
      </dl>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { omit, startCase, sum } from "lodash";
import {
  notAuthed,
  useAnalyticsOverview,
  useCoreProjects,
  useProjects,
  usePublications,
  useRepositoriesOverview,
} from "@/api";
import Book from "@/assets/book.svg";
import Chart from "@/assets/chart.svg";
import Code from "@/assets/code.svg";
import Eye from "@/assets/eye.svg";
import Home from "@/assets/home.svg";
import AppCheckbox from "@/components/AppCheckbox.vue";
import AppHeading from "@/components/AppHeading.vue";
import AppLink from "@/components/AppLink.vue";
import type { Cols } from "@/components/AppTable.vue";
import AppTable from "@/components/AppTable.vue";
import AppTimeChart from "@/components/AppTimeChart.vue";
import { carve } from "@/util/array";
import { bytes, format } from "@/util/string";

/** fetch data */
const { data: coreProjects } = useCoreProjects();
const { data: projects } = useProjects();
const { data: publications } = usePublications();
const { data: analyticsOverview } = useAnalyticsOverview();
const { data: repositoriesOverview } = useRepositoriesOverview();

/** whether charts should be shown in cumulative mode */
const cumulative = ref(true);

/** chart number of projects over time */
const projectsOverTime = computed(
  () => projects.value?.map(({ dateStart }) => [dateStart, 1] as const) || [],
);

/** chart award amount per fiscal year */
const awardsOverTime = computed(
  () =>
    projects.value
      ?.filter(({ fiscalYear }) => fiscalYear)
      .map(
        ({ fiscalYear, awardAmount }) =>
          [new Date(fiscalYear, 0, 1), awardAmount] as const,
      ) || [],
);

/** chart number of publications over time */
const publicationsOverTime = computed(
  () =>
    publications.value
      ?.map(({ year }) => year)
      .filter(Boolean)
      .map((year) => [new Date(year, 0, 1), 1] as const) || [],
);

/** publication table column definitions */
const publicationCols: Cols<NonNullable<typeof publications.value>> = [
  {
    slot: "id",
    key: "id",
    name: "ID",
    align: "left",
    style: { whiteSpace: "nowrap" },
  },
  {
    slot: "project",
    key: "coreProject",
    name: "Project",
    align: "left",
    style: { whiteSpace: "nowrap" },
  },
  {
    key: "title",
    name: "Title",
    align: "left",
  },
  {
    slot: "authors",
    key: "authors",
    name: "Authors",
    align: "left",
  },
  {
    key: "relativeCitationRatio",
    name: "RCR",
  },
  {
    key: "rank",
    name: "SJR",
  },
  {
    key: "citations",
    name: "Citations",
  },
  {
    key: "citationsPerYear",
    name: "Cit./year",
  },
  {
    key: "journal",
    name: "Journal",
    align: "left",
  },
  {
    slot: "year",
    key: "year",
    name: "Published",
  },
  {
    key: "modified",
    name: "Updated",
  },
];
</script>
