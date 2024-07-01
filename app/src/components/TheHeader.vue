<template>
  <header>
    <h1><img src="@/assets/icon.png" alt="" />{{ title }}</h1>

    <nav>
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/core-projects">Core Projects</RouterLink>
    </nav>
  </header>
</template>

<script setup lang="ts">
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
  background: var(--light-gray);
}

header img {
  height: 2em;
}

header h1 {
  width: unset;
}

header a {
  padding: 2px 5px;
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
