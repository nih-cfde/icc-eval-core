<template>
  <component :is="tag" :id="link" ref="heading">
    <slot />

    <AppLink
      v-if="link"
      :to="'#' + link"
      class="anchor"
      :aria-label="'Link to this section'"
    >
      <Link />
    </AppLink>
  </component>
</template>

<script setup lang="ts">
import { computed, onMounted, onUpdated, ref } from "vue";
import { kebabCase } from "lodash";
import Link from "@/assets/link.svg";
import AppLink from "@/components/AppLink.vue";

type Props = {
  /** heading level */
  level: "1" | "2" | "3" | "4";
  /** manually specified id */
  id?: string;
};

const props = defineProps<Props>();

type Slots = {
  default: () => unknown;
};

defineSlots<Slots>();

/** hash link of heading */
const link = ref("");

/** tag of heading */
const tag = computed(() => "h" + props.level);

/** heading ref */
const heading = ref<HTMLElement>();

/** determine link from text content of heading */
function updateLink() {
  link.value = kebabCase(props.id ?? heading.value?.textContent ?? "");
}

onMounted(updateLink);
onUpdated(updateLink);
</script>

<style scoped>
.anchor {
  position: relative;
  left: 0.75em;
  width: 0;
  height: 0.75em;
  margin-left: -0.75em;
  padding: 0;
  opacity: 0;
  transition:
    opacity var(--fast),
    color var(--fast);
}

.anchor > svg {
  height: 100%;
}

.anchor:hover {
  color: var(--light-gray);
}

.anchor:focus {
  opacity: 1;
}

:is(h1, h2, h3, h4):hover .anchor {
  opacity: 1;
}
</style>
