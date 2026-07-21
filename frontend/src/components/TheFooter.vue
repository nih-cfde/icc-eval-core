<template>
  <footer>
    <AppLink to="https://github.com/nih-cfde/icc-eval-core" class="print-hide">
      Learn more
    </AppLink>

    <span>
      Developed with support from NIH Award
      <AppLink to="/core-project/U54OD036472">U54 OD036472</AppLink>
    </span>
  </footer>
</template>

<script setup lang="ts">
import AppLink from "@/components/AppLink.vue";

const builtOn = BUILT_ON;

console.info(`Frontend built on ${builtOn}`);
</script>

<style scoped>
footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 20px;
  gap: 10px 20px;
  background: var(--theme-light);
}

footer a {
  text-decoration: none;
}

.spacer {
  flex-grow: 1;
}

@media print {
  .print-hide {
    display: none;
  }
}
</style>
