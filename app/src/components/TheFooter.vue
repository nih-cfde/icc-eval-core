<template>
  <footer>
    <div class="row">
      <AppLink to="https://github.com/nih-cfde/icc-eval-core">
        Learn more
      </AppLink>
    </div>

    <div class="row">Developed with support from NIH Award U54 OD036472</div>
  </footer>
</template>

<script setup lang="ts">
import AppLink from "@/components/AppLink.vue";
</script>

<style scoped>
footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  gap: 20px;
  background: var(--light-gray);
}

footer a {
  padding: 2px 5px;
  text-decoration: none;
}

@media (max-width: 800px) {
  footer {
    flex-direction: column;
  }
}

@media print {
  footer {
    display: none;
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
