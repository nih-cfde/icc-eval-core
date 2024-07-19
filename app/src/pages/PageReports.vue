<template>
  <section>
    <h1>Reports</h1>
  </section>

  <section>
    <div class="grid">
      <AppLink
        v-for="(pdf, key) in pdfs"
        :key="key"
        :to="`/pdfs/${pdf}.pdf`"
        :new-tab="true"
        :external="false"
      >
        {{ pdf }}
      </AppLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import AppLink from "@/components/AppLink.vue";
import { pdfs } from "@/pages/reports";
</script>

<style scoped>
.grid {
  --cols: 3;
  display: grid;
  grid-template-columns: repeat(var(--cols), auto);
  place-content: center;
  width: 100%;
  gap: 20px;
}

@media (max-width: 800px) {
  .grid {
    --cols: 2;
  }
}

@media (max-width: 550px) {
  .grid {
    --cols: 1;
  }
}
</style>
