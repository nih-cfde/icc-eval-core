import { createApp } from "vue";
import VueGtagPlugin from "vue-gtag";
import { createRouter, createWebHistory } from "vue-router";
import { VueQueryPlugin } from "@tanstack/vue-query";
import App from "./App.vue";
import PageCoreProject from "./pages/PageCoreProject.vue";
import PageCoreProjects from "./pages/PageCoreProjects.vue";
import PageDrc from "./pages/PageDrc.vue";
import PageHome from "./pages/PageHome.vue";
import PageReports from "./pages/PageReports.vue";
import "./styles.css";

const domain = "metrics-cfdeconnect.org";

/** app pages */
const routes = [
  {
    path: "/",
    component: PageHome,
    beforeEnter: () => {
      let url = new URL(window.location.href);

      /** force new domain */
      url.hostname = domain;

      /** handle SPA redirect (see 404.html) */
      const redirect = window.sessionStorage.redirect as string;
      window.sessionStorage.removeItem("redirect");
      if (redirect) {
        console.debug("Redirecting to:", redirect);
        /** merge */
        url = new URL(redirect, url);
      }

      /** redirect if anything changed */
      if (window.location.href !== url.href) window.location.href = url.href;
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
  .use(VueQueryPlugin)
  .mount("#app");
