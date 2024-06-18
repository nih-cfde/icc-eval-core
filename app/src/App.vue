<template>
  <TheHeader />
  <main>
    <RouterView />
  </main>
  <TheFooter />
</template>

<script setup lang="ts">
import TheFooter from "@/components/TheFooter.vue";
import TheHeader from "@/components/TheHeader.vue";
</script>
