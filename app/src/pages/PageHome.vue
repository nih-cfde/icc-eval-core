<template>
  <section>
    <h2>Home</h2>

    <AppButton to="/projects"><Microscope />Projects</AppButton>
  </section>
</template>

<script setup lang="ts">
import Microscope from "@/assets/microscope.svg";
import AppButton from "@/components/AppButton.vue";
</script>
