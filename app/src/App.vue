<template>
  <TheHeader />
  <main class="charts">
    <AppChart title="Opportunity Prefixes" :data="prefixes" />
    <AppChart title="Opportunity Activity Codes" :data="activityCodes" />
  </main>
  <TheFooter />
</template>

<script setup lang="ts">
import AppChart from "@/components/AppChart.vue";
import TheFooter from "@/components/TheFooter.vue";
import TheHeader from "@/components/TheHeader.vue";
import data from "./data.json";

const prefixes = Object.fromEntries(
  data.opportunities.prefixes.map(({ prefix, count }) => [prefix, count]),
);
const activityCodes = Object.fromEntries(
  data.opportunities.activityCodes.map(({ activity_code, count }) => [
    activity_code,
    count,
  ]),
);
</script>

<style scoped>
.charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(500px, 100%), 1fr));
  grid-auto-rows: minmax(200px, calc(11in * 0.35));
  gap: 40px;
}
</style>
