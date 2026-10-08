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
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { groupBy, mean, orderBy } from "lodash";
import { Calendar } from "@lucide/vue";
import { useEvents } from "@/api";
import AppHeading from "@/components/AppHeading.vue";
import { median } from "@/util/array";
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

const attendance = computed(
  () => events.value?.flatMap((event) => event.attendanceOutcome || []) ?? [],
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
      "events",
    ],
  ],
  [
    "Attendance",
    [mean(attendance.value), "average"],
    [median(attendance.value), "median"],
  ],
  ...orderBy(
    Object.entries(groupBy(events.value ?? [], (event) => event.organizer)),
    ([, value]) => value,
    "desc",
  )
    .filter(([organizer]) => organizer)
    .map(([organizer, events]) => [organizer, format(events.length)]),
]);
</script>
