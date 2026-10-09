<template>
  <component :is="component" :[toAttr]="to" :target="target" class="link">
    <slot />
    <ExternalLink v-if="arrow ?? external" />
  </component>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ExternalLink } from "@lucide/vue";

type Props = {
  /** internal route or external url to link to */
  to: string;
  /** force arrow icon or not */
  arrow?: boolean;
  /** force new tab or not */
  newTab?: boolean;
};

const { to, arrow = undefined, newTab = undefined } = defineProps<Props>();

type Slots = {
  default?: () => unknown;
};

defineSlots<Slots>();

/** is link to internal route or external url */
const external = computed(() =>
  ["https:", "http:", "mailto:"].some((prefix) => to.startsWith(prefix)),
);

const component = computed(() =>
  to ? (external.value ? "a" : "router-link") : "span",
);

const toAttr = computed(() => (external.value ? "href" : "to"));

const target = computed(() => ((newTab ?? external.value) ? "_blank" : ""));
</script>

<style scoped>
.link > svg {
  position: relative;
  top: 0.05em;
  margin-left: 0.35em;
}
</style>
