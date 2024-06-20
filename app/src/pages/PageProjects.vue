<template>
  <section>
    <h2><Microscope />Projects</h2>

    <div class="grid">
      <RouterLink
        v-for="(_, key) in projects"
        :key="key"
        :to="`/project/${key}`"
        >{{ key }}</RouterLink
      >
    </div>
  </section>
</template>

<script setup lang="ts">
import Microscope from "@/assets/microscope.svg";
import projects from "@/data/publications-per-core-project.json";
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, 120px);
  place-content: center;
  place-items: center;
  width: 100%;
  gap: 10px;
}
</style>
