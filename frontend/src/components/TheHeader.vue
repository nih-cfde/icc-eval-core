<template>
  <header>
    <div class="title">
      <img src="@/assets/icon.png" alt="" />
      <AppLink to="/">
        {{ title }}
      </AppLink>
    </div>

    <nav>
      <AppLink
        v-if="!user && userStatus !== 'pending'"
        :to="loginLink"
        :new-tab="false"
      >
        Log In
      </AppLink>
      <template v-if="user && userStatus === 'success'">
        <div
          class="user"
          tabindex="0"
          :title="`Logged in as: ${user.firstName} ${user.lastName}\nORCID: ${user.orcid}`"
        >
          <div>
            {{
              [user.firstName, user.lastName]
                .map((part) => part.charAt(0).toUpperCase())
                .join("") ||
              user.username.substring(0, 2).toUpperCase() ||
              "You"
            }}
          </div>
        </div>
        <AppLink :to="logoutLink" :new-tab="false">Log Out</AppLink>
      </template>

      <AppLink to="/">Home</AppLink>
      <AppLink to="/core-projects">Core Projects</AppLink>
      <AppLink to="/drc">DRC</AppLink>
      <AppLink to="/about">About</AppLink>
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
  padding: 0 5px;
  text-decoration: none;
}

header a:hover {
  background: var(--theme);
  color: white;
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
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: #00000010;
  color: var(--dark-gray);
}
</style>
