<template>
  <footer>
    <div class="row print-hide">
      <AppLink
        v-if="pdf"
        :to="`/pdfs/${pdf}.pdf`"
        :new-tab="true"
        :external="true"
      >
        PDF of this page
        <Download />
      </AppLink>

      <AppLink
        to="https://github.com/nih-cfde/icc-eval-core"
        :title="`Built on ${builtOn}`"
      >
        Learn more
      </AppLink>
    </div>

    <div class="row print-show">Generated on {{ builtOn }}</div>

    <div class="row">
      <span>
        Developed with support from NIH Award
        <AppLink to="/core-project/U54OD036472">U54 OD036472</AppLink>
      </span>
    </div>
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
  justify-content: space-between;
  padding: 20px;
  gap: 20px;
  background: var(--off-white);
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

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 20px;
  text-align: center;
}

@media print {
  .print-hide {
    display: none;
  }
}

@media screen {
  .print-show {
    display: none;
  }
}
</style>
