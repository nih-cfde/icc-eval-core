<template>
  <footer>
    <div class="row">
      <a href="https://github.com/nih-cfde/icc-eval-core" target="_blank">
        Learn more<External />
      </a>
    </div>

    <div class="row">Developed with support from NIH Award U54 OD036472</div>
  </footer>
</template>

<script setup lang="ts">
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

@media (max-width: 800px) {
  footer {
    flex-direction: column;
  }
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 20px;
  text-align: center;
}
</style>
