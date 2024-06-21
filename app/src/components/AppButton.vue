<template>
  <component :is="component" class="button" :href="to" :to="to" @click="click">
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from "vue";

type Props = {
  /** text to show */
  text?: string;
  /** icon to show */
  icon?: string;
  /** location to link to */
  to?: string;
  /** on click action */
  click?: () => unknown;
  /** whether link is a download link */
  download?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  text: "",
  icon: "",
  to: "",
  click: undefined,
  download: undefined,
});

/** type of component to render */
const component = computed(() =>
  props.to ? (props.download ? "a" : "RouterLink") : "button",
);

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
  background: var(--light-gray);
  color: var(--theme);
}

@media print {
  .button {
    display: none;
  }
}
</style>
