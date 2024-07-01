<template>
  <component
    :is="component"
    :to="to"
    :href="to"
    :target="external ? '_blank' : ''"
  >
    <slot />
    <External v-if="external" />
  </component>
</template>

<script setup lang="ts">
import { computed } from "vue";
import External from "@/assets/external.svg";

type Props = {
  to: string;
};

const props = defineProps<Props>();

type Slots = {
  default: () => unknown;
};

defineSlots<Slots>();

const external = computed(() => props.to.startsWith("http"));

const component = computed(() => (external.value ? "a" : "RouterLink"));
</script>
