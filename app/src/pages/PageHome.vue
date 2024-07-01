<template>
  <section>
    <h2>Home</h2>
  </section>

  <section>
    <h3>Total CFDE Stats</h3>

    <div class="mini-table">
      <span>Projects</span>
      <span>{{
        sum(rows.map((row) => row.projects.length)).toLocaleString()
      }}</span>
      <span>Awards</span>
      <span>{{
        sum(rows.map((row) => row.award_amount)).toLocaleString(undefined, {
          style: "currency",
          currency: "USD",
        })
      }}</span>
      <span>Publications</span>
      <span>{{
        sum(rows.map((row) => row.publications)).toLocaleString()
      }}</span>
    </div>
    <AppButton to="/core-projects"><Microscope />Core Projects</AppButton>
  </section>
</template>

<script setup lang="ts">
import { sum } from "lodash";
import Microscope from "@/assets/microscope.svg";
import AppButton from "@/components/AppButton.vue";
import coreProjects from "@/data/core-projects.json";

/** convert data from object to array */
const rows = Object.entries(coreProjects).map(([id, rest]) => ({
  id,
  ...rest,
}));
</script>
