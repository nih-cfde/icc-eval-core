import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import PageCoreProject from "./pages/PageCoreProject.vue";
import PageCoreProjects from "./pages/PageCoreProjects.vue";
import PageHome from "./pages/PageHome.vue";
import "./styles.css";

const routes = [
  { path: "/", component: PageHome },
  { path: "/core-projects", component: PageCoreProjects },
  { path: "/core-project/:id", component: PageCoreProject },
];

const router = createRouter({ history: createWebHistory(), routes });

createApp(App).use(router).mount("#app");
