<template>
  <footer>
    <div class="row">
      <a href="report.pdf" target="_blank">PDF<Download /></a>
      <a href="https://github.com/nih-cfde/icc-eval-core" target="_blank">
        Learn more<External />
      </a>
    </div>

    <div class="row">Developed with support from NIH Award U54 OD036472</div>
  </footer>
</template>

<script setup lang="ts">
import Download from "@/assets/download.svg";
import External from "@/assets/external.svg";
</script>

<style scoped>
footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  gap: 20px;
  background: var(--theme-dark);
  color: white;
}

footer a {
  color: currentColor;
  text-decoration: none;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 20px;
}
</style>
