<template>
  <section>
    <AppHeading level="1"><Calendar />Events</AppHeading>

    <dl class="details">
      <div
        v-for="([name, ...detail], detailIndex) in details"
        :key="detailIndex"
      >
        <dt>{{ name }}</dt>
        <dd>
          <template v-for="(line, lineIndex) of detail" :key="lineIndex">
            <template v-if="!Array.isArray(line) || line[0] !== '0'">
              {{ [line].flat().join(" ") }}
              <br />
            </template>
          </template>
        </dd>
      </div>
    </dl>

    <div class="charts">
      <AppTimeChart title="Events" :data="overTime" by="month" />
      <AppHistoChart
        title="Attendance"
        x-label="Attendees"
        y-label="Events"
        :data="byAttendance"
        :bin-size="10"
      />
      <AppPieChart title="Organizer" :data="byOrganizer" />
      <AppPieChart title="Involved" :data="byInvolved" />
      <AppPieChart title="Length" :data="byLength" />
      <AppHistoChart
        title="Length (work hours)"
        x-label="Length (work hours)"
        y-label="Events"
        :data="byLengthAbs"
        :bin-size="4"
      />
      <AppPieChart title="Format" :data="byFormat" />
      <AppPieChart title="Purpose" :data="purpose" />
      <AppPieChart title="Tags" :data="byTag" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { eachHourOfInterval, getHours, isWeekend, max, min } from "date-fns";
import { Calendar } from "@lucide/vue";
import { useEvents } from "@/api";
import AppHeading from "@/components/AppHeading.vue";
import AppHistoChart from "@/components/AppHistoChart.vue";
import AppPieChart from "@/components/AppPieChart.vue";
import AppTimeChart from "@/components/AppTimeChart.vue";
import { format } from "@/util/string";

const postEventKeys = [
  "attendanceOutcome",
  "engagementOutcome",
  "awarenessOutcome",
  "resourcesOutcome",
  "timingOutcome",
  "platformOutcome",
  "conclusion",
];

/** fetch event data */
const { data: events } = useEvents();

/** attendance breakdown */
const byAttendance = computed(
  () => events.value?.flatMap((event) => event.attendanceOutcome || []) ?? [0],
);

/** event counts by organizer */
const byOrganizer = computed(() =>
  (events.value ?? []).map((event) => [event.organizer, 1] as const),
);

/** event counts by involved groups */
const byInvolved = computed(() =>
  (events.value ?? []).flatMap((event) =>
    event.involved.split(",").map((group) => [group.trim(), 1] as const),
  ),
);

/** event counts by length */
const byLength = computed(() =>
  (events.value ?? []).map((event) => [event.length, 1] as const),
);

/** event length, actual end minus start */
const byLengthAbs = computed(() =>
  (events.value ?? [])
    .flatMap(({ start, end }) => {
      if (!start || !end) return [];
      /** guard against end before start */
      const interval = { start: min([start, end]), end: max([start, end]) };
      return eachHourOfInterval(interval).filter(
        (hour) =>
          /** only during normal work hours */
          getHours(hour) >= 9 &&
          getHours(hour) < 9 + 8 &&
          /** discount weekends */
          !isWeekend(hour),
      ).length;
    })
    /** remove outliers */
    .filter((length) => length < 200),
);

/** event counts by format */
const byFormat = computed(() =>
  (events.value ?? []).map((event) => [event.format, 1] as const),
);

/** event counts by purpose */
const purpose = computed(() =>
  (events.value ?? []).map((event) => [event.purpose, 1] as const),
);

/** event counts by tag */
const byTag = computed(() =>
  (events.value ?? []).flatMap((event) =>
    event.tags.split(",").map((tag) => [tag.trim(), 1] as const),
  ),
);

/** event counts over time by start date */
const overTime = computed(() =>
  (events.value ?? [])
    .map((event) => event.start)
    .filter((start) => start !== null)
    .map((start) => [start, 1] as const),
);

/** top-level details */
const details = computed(() => [
  ["Events", `${format(events.value?.length ?? 0)} total`],
  [
    "Post-event",
    [
      format(
        events.value?.filter((event) =>
          postEventKeys.some((key) => event[key as keyof typeof event]),
        ).length ?? 0,
      ),
      "surveys",
    ],
  ],
]);
</script>
