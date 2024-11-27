import { createApp } from "vue";
import VueGtagPlugin from "vue-gtag";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import PageCoreProject from "./pages/PageCoreProject.vue";
import PageCoreProjects from "./pages/PageCoreProjects.vue";
import PageDrc from "./pages/PageDrc.vue";
import PageHome from "./pages/PageHome.vue";
import PageReports from "./pages/PageReports.vue";
import "./styles.css";

/** app pages */
const routes = [
  {
    path: "/",
    component: PageHome,
    beforeEnter: () => {
      const url = window.sessionStorage.redirect as string;
      if (url) {
        console.debug("Redirecting to:", url);
        window.sessionStorage.removeItem("redirect");
        return url;
      }
    },
  },
  { path: "/reports", component: PageReports },
  { path: "/core-projects", component: PageCoreProjects },
  { path: "/core-project/:id", component: PageCoreProject },
  { path: "/drc", component: PageDrc },
];

const router = createRouter({ history: createWebHistory(), routes });

createApp(App)
  .use(router)
  .use(VueGtagPlugin, {
    config: { id: "G-ES3DWJYSXR", enabled: import.meta.env.PROD },
  })
  .mount("#app");
