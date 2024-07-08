<template>
  <component :is="component" class="button" :to="to" @click="click">
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from "vue";
import AppLink from "@/components/AppLink.vue";

type Props = {
  /** text to show */
  text?: string;
  /** icon to show */
  icon?: string;
  /** location to link to */
  to?: string;
  /** on click action */
  click?: () => unknown;
};

const props = withDefaults(defineProps<Props>(), {
  text: "",
  icon: "",
  to: "",
  click: undefined,
  download: undefined,
});

/** type of component to render */
const component = computed(() => (props.to ? AppLink : "button"));

type Slots = {
  default: () => unknown;
};

defineSlots<Slots>();
</script>

<style scoped>
.button {
  display: inline-flex;
  appearance: none;
  align-items: center;
  justify-content: center;
  padding: 8px 15px;
  gap: 10px;
  border-radius: var(--rounded);
  background: var(--theme);
  color: white;
  text-decoration: none;
  transition: var(--fast);
  transition-property: background;
}

.button:hover {
  background: var(--off-white);
  color: var(--theme);
}

@media print {
  .button {
    display: none;
  }
}
</style>
