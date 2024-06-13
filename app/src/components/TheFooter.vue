<template>
  <footer>
    <a href="report.pdf" target="_blank">PDF<Download /></a>
    <a href="https://github.com/nih-cfde/icc-eval-core" target="_blank">
      Learn more<External />
    </a>
  </footer>
</template>

<script setup lang="ts">
import Download from "@/assets/download.svg";
import External from "@/assets/external.svg";
</script>

<style scoped>
footer {
  display: flex;
  align-items: center;
  padding: 20px;
  gap: 20px;
  background: var(--theme-dark);
  color: white;
}

footer a {
  color: currentColor;
  text-decoration: none;
}
</style>
