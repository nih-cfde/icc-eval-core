<template>
  <header>
    <div class="title">
      <img src="@/assets/icon.png" alt="" />
      <AppLink to="/">
        {{ title }}
      </AppLink>
    </div>

    <nav>
      <AppLink to="/">Home</AppLink>
      <AppLink to="/core-projects">Core Projects</AppLink>
    </nav>
  </header>
</template>

<script setup lang="ts">
import AppLink from "@/components/AppLink.vue";

const { VITE_TITLE: title } = import.meta.env;
</script>

<style scoped>
header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  gap: 20px;
  background: var(--off-white);
}

.title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.2rem;
}

.title img {
  height: 2em;
}

header a {
  text-decoration: none;
}

@media (max-width: 800px) {
  header {
    flex-direction: column;
  }
}

nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 20px;
  font-size: 1.2rem;
  text-align: center;
}

@media print {
  header {
    justify-content: center;
  }

  nav {
    display: none;
  }
}
</style>
