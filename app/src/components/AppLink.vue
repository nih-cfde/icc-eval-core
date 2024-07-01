<template>
  <component
    :is="external ? 'a' : 'RouterLink'"
    class="link"
    :to="external ? undefined : to"
    :href="external ? to : undefined"
    :target="external ? '_blank' : ''"
  >
    <slot />
    <External v-if="external" />
  </component>
</template>

<script setup lang="ts">
import { computed, useAttrs } from "vue";
import External from "@/assets/external.svg";

type Props = {
  /** internal route or external url to link to */
  to: string;
};

const props = defineProps<Props>();

type Slots = {
  default: () => unknown;
};

defineSlots<Slots>();

/** is link to internal route or external url */
const external = computed(
  () => props.to.startsWith("http") || "download" in useAttrs(),
);
</script>

<style scoped>
.link > svg + svg {
  display: none;
}
</style>
