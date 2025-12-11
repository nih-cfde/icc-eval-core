<template>
  <button class="button">
    <slot />
  </button>
</template>

<style scoped>
.button {
  padding: 10px;
  border-radius: var(--rounded);
  background: var(--light-gray);
}
</style>
