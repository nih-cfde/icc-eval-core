<template>
  <header>
    <div class="title">
      <img src="@/assets/icon.png" alt="" />
      <AppLink to="/">
        {{ title }}
      </AppLink>
    </div>

    <nav>
      <template v-if="userStatus === 'success'">
        <AppLink v-if="!user" :to="loginLink">Login</AppLink>
        <template v-else>
          <span class="user">
            {{ user.firstName }} {{ user.lastName }} {{ user.orcid }}
          </span>
          <AppLink :to="logoutLink">Logout</AppLink>
        </template>
      </template>

      <AppLink to="/">Home</AppLink>
      <AppLink to="/core-projects">Core Projects</AppLink>
      <AppLink to="/drc">DRC</AppLink>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { getMe, loginLink, logoutLink } from "@/api";
import AppLink from "@/components/AppLink.vue";

const { VITE_TITLE: title } = import.meta.env;

const { data: user, status: userStatus } = useQuery({
  queryKey: ["getMe"],
  queryFn: getMe,
});
</script>

<style scoped>
header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  gap: 20px;
  background: var(--theme-light);
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

.user {
  color: var(--theme-dark);
  font-size: 0.9rem;
}
</style>
