import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import PageHome from "./pages/PageHome.vue";
import PageProject from "./pages/PageProject.vue";
import "./styles.css";

const routes = [
  { path: "/", component: PageHome },
  { path: "/project/:project", component: PageProject },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

createApp(App).use(router).mount("#app");
