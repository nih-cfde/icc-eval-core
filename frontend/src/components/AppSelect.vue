<template>
  <select
    class="select"
    :value="modelValue"
    @change="
      $emit(
        'update:modelValue',
        ($event.target as HTMLSelectElement).value as Option['value'],
      )
    "
  >
    <option v-for="{ value, label } in options" :key="value" :value="value">
      {{ label ?? value }}
    </option>
  </select>
</template>

<script
  lang="ts"
  setup
  generic="Option extends { value: string | number; label?: string }"
>
type Props = {
  options: Option[];
};

defineProps<Props>();

defineModel<Option["value"]>();
</script>

<style scoped>
.select {
  padding: 5px 10px;
  border: none;
  border-radius: var(--rounded);
  background: var(--light-gray);
}
</style>
