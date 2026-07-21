<template>
  <component :is="component" :[toAttr]="to" :target="target" class="link">
    <slot />
    <External v-if="arrow ?? external" />
  </component>
</template>

<script setup lang="ts">
import { computed } from "vue";
import External from "@/assets/external.svg";

type Props = {
  /** internal route or external url to link to */
  to: string;
  /** force arrow icon or not */
  arrow?: boolean;
  /** force new tab or not */
  newTab?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  arrow: undefined,
  newTab: undefined,
});

type Slots = {
  default?: () => unknown;
};

defineSlots<Slots>();

/** is link to internal route or external url */
const external = computed(() =>
  ["https:", "http:", "mailto:"].some((prefix) => props.to.startsWith(prefix)),
);

const component = computed(() =>
  props.to ? (external.value ? "a" : "router-link") : "span",
);

const toAttr = computed(() => (external.value ? "href" : "to"));

const target = computed(() =>
  (props.newTab ?? external.value) ? "_blank" : "",
);
</script>

<style scoped>
.link > svg {
  position: relative;
  top: 0.05em;
  margin-left: 0.35em;
}
</style>
