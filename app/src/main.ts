import { createApp } from "vue";
import { configure } from "vue-gtag";
import { createRouter, createWebHistory } from "vue-router";
import { VueQueryPlugin } from "@tanstack/vue-query";
import App from "./App.vue";
import PageCoreProject from "./pages/PageCoreProject.vue";
import PageCoreProjects from "./pages/PageCoreProjects.vue";
import PageDrc from "./pages/PageDrc.vue";
import PageHome from "./pages/PageHome.vue";
import PageReports from "./pages/PageReports.vue";
import "./styles.css";

const domain = "metrics.cfdeconnect.org";

/** app pages */
const routes = [
  {
    path: "/",
    component: PageHome,
    beforeEnter: () => {
      /** get redirect path from 404.html */
      const redirect = window.sessionStorage.redirect as string;
      window.sessionStorage.removeItem("redirect");

      /** redirect to new domain */
      if (window.location.hostname !== domain) {
        window.location.href = new URL(redirect, `https://${domain}`).href;
        return;
      }

      /** redirect to path */
      if (redirect) {
        console.debug("Redirecting to:", redirect);
        return redirect;
      }
    },
  },
  { path: "/reports", component: PageReports },
  { path: "/core-projects", component: PageCoreProjects },
  { path: "/core-project/:id", component: PageCoreProject },
  { path: "/drc", component: PageDrc },
];

const router = createRouter({ history: createWebHistory(), routes });

if (import.meta.env.PROD)
  configure({
    tagId: "G-ES3DWJYSXR",
    pageTracker: { router },
  });

createApp(App).use(router).use(VueQueryPlugin).mount("#app");
