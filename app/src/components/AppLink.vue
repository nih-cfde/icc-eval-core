<template>
  <component
    :is="external ? 'a' : 'RouterLink'"
    class="link"
    :to="external ? undefined : to"
    :href="to"
    :target="(external && newTab !== false) || newTab === true ? '_blank' : ''"
  >
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
  /** force new tab or not */
  newTab?: boolean;
};

const props = defineProps<Props>();

type Slots = {
  default: () => unknown;
};

defineSlots<Slots>();

/** is link to internal route or external url */
const external = computed(() => props.to.startsWith("http"));
</script>

<style scoped>
.link > svg + svg {
  display: none;
}
</style>
