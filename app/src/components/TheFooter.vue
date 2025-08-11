<template>
  <footer>
    <AppLink
      v-if="pdf"
      :to="`/pdfs/${pdf}.pdf`"
      :new-tab="true"
      :external="true"
      class="print-hide"
    >
      PDF of this page
      <Download />
    </AppLink>

    <AppLink to="https://github.com/nih-cfde/icc-eval-core" class="print-hide">
      Learn more
    </AppLink>

    <span>Built on {{ builtOn }}</span>

    <span class="spacer" />

    <span>
      Developed with support from NIH Award
      <AppLink to="/core-project/U54OD036472">U54 OD036472</AppLink>
    </span>
  </footer>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import Download from "@/assets/download.svg";
import AppLink from "@/components/AppLink.vue";
import { pdfs } from "@/pages/reports";

const route = useRoute();

/** download link for pre-generated pdf file associated with this route */
const pdf = computed(() => pdfs.value[route.fullPath]);

const builtOn = BUILT_ON;
</script>

<style scoped>
footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 20px;
  gap: 10px 20px;
  background: var(--off-white);
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
