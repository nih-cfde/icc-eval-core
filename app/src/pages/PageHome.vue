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
            format(sum(coreProjects.map((row) => row.projects.length)), true)
          }}
        </dd>
      </div>

      <div>
        <dt>Awards</dt>
        <dd>
          {{
            format(sum(coreProjects.map((row) => row.awardAmount)), true, {
              style: "currency",
              currency: "USD",
            })
          }}
        </dd>
      </div>

      <div>
        <dt>Publications</dt>
        <dd>
          {{ format(sum(coreProjects.map((row) => row.publications)), true) }}
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
        title="Award Amount"
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

  <!-- publications -->
  <section>
    <AppHeading level="2"><Book />Publications</AppHeading>

    <p>Latest CFDE published works.</p>

    <AppTable
      :cols="publicationCols"
      :rows="programPublications"
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
        <AppLink :to="`/core-project/${row.coreProject}`">
          {{ row.coreProject }}
        </AppLink>
      </template>

      <template #authors="{ row }">
        <template v-for="(author, key) of carve(row.authors, 2)" :key="key">
          {{ author }}
          <br />
        </template>
      </template>

      <template #year="{ row }">{{ row.year }}</template>
    </AppTable>

    <template v-if="Object.keys(publicationsOverTime).length > 1">
      <AppTimeChart
        class="chart"
        title="Publications"
        :data="publicationsOverTime"
        :cumulative="cumulative"
        by="month"
      />

      <AppCheckbox v-model="cumulative">Cumulative</AppCheckbox>
    </template>

    <div class="col">
      <AppHeading level="3">Notes</AppHeading>

      <dl class="mini-table">
        <dt>RCR</dt>
        <dd>
          <AppLink to="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5012559/"
            >Relative Citation Ratio</AppLink
          >
        </dd>
        <dt>SJR</dt>
        <dd>
          <AppLink to="https://www.scimagojr.com/journalrank.php"
            >Scimago Journal Rank</AppLink
          >
        </dd>
      </dl>
    </div>
  </section>

  <!-- repositories -->
  <section v-if="repoOverview.repos">
    <AppHeading level="2"><Code />Repositories</AppHeading>

    <p>High-level info about CFDE software repositories.</p>

    <dl class="details">
      <div
        v-for="(repoValue, repoProp, repoIndex) in repoOverview"
        :key="repoIndex"
        :style="{
          gridColumn: typeof repoValue === 'number' ? 'span 1' : 'span 2',
        }"
      >
        <dt>{{ startCase(repoProp) }}</dt>
        <dd v-if="typeof repoValue === 'number'">
          {{ format(repoValue, true) }}
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
                format(
                  repoProp === "languages" ? entryCount / 160 : entryCount,
                  true,
                )
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
import { computed, ref } from "vue";
import { orderBy, startCase, sum } from "lodash";
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
import { format } from "@/util/string";
import coreProjects from "~/core-projects.json";
import journals from "~/journals.json";
import rawProjects from "~/projects.json";
import publications from "~/publications.json";
import repoOverview from "~/repo-overview.json";

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
const publicationsOverTime = publications
  .map(({ year }) => year)
  .filter(Boolean)
  .map((year) => [new Date(year, 0, 1), 1] as const);

/** publication table row data */
const programPublications = computed(() =>
  orderBy(
    publications.map((publication) => {
      /** look up journal matching this publication */
      const journal = journals.find(
        (journal) => journal.id === publication.journal,
      );
      /** include journal info */
      return {
        ...publication,
        year: publication.year,
        modified: new Date(publication.modified),
        rank: journal?.rank ?? 0,
        journal: journal?.name ?? publication.journal,
      };
    }),
    (publication) => publication.year,
    "desc",
  ).slice(0, 10),
);

/** publication table column definitions */
const publicationCols: Cols<typeof programPublications.value> = [
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
