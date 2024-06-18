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
  padding: 20px;
  background: var(--theme-dark);
  color: white;
}

header a {
  color: currentColor;
  text-decoration: none;
}
</style>
