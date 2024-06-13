<template>
  <header>
    <h1>{{ title }}</h1>
  </header>
</template>

<script setup lang="ts">
const { VITE_TITLE: title } = import.meta.env;
</script>

<style scoped>
header {
  background: var(--dark);
  color: white;
  padding: 20px;
}
</style>
