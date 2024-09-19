<template>
  <component :is="component" :[toAttr]="to" :target="target" class="link">
    <slot />
    <External v-if="external" />
  </component>
</template>

<script setup lang="ts">
import { computed } from "vue";
import External from "@/assets/external.svg";

type Props = {
  /** internal route or external url to link to */
  to: string;
  /** force external link or not */
  external?: boolean;
  /** force new tab or not */
  newTab?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  external: undefined,
  newTab: undefined,
});

type Slots = {
  default?: () => unknown;
};

defineSlots<Slots>();

/** is link to internal route or external url */
const external = computed(
  () =>
    props.external ??
    ["http:", "mailto:"].some((prefix) => props.to.startsWith(prefix)),
);

const component = computed(() => (external.value ? "a" : "router-link"));

const toAttr = computed(() => (external.value ? "href" : "to"));

const target = computed(() =>
  (props.newTab ?? external.value) ? "_blank" : "",
);
</script>

<style scoped>
.link > svg + svg {
  display: none;
}
</style>
