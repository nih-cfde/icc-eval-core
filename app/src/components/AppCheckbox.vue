<template>
  <label class="checkbox">
    <input v-model="model" type="checkbox" class="input" />
    <slot />
  </label>
</template>

<script setup lang="ts">
const model = defineModel<boolean>();

type Slots = {
  default: () => void;
};

defineSlots<Slots>();
</script>

<style scoped>
.checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.input {
  width: 20px;
  height: 20px;
  accent-color: var(--theme);
  cursor: pointer;
}

@media print {
  .checkbox {
    display: none;
  }
}
</style>
