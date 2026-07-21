import { createApp } from "vue";
import { configure } from "vue-gtag";
import { createRouter, createWebHistory } from "vue-router";
import { VueQueryPlugin } from "@tanstack/vue-query";
import App from "./App.vue";
import PageAbout from "./pages/PageAbout.vue";
import PageCoreProject from "./pages/PageCoreProject.vue";
import PageCoreProjects from "./pages/PageCoreProjects.vue";
import PageDrc from "./pages/PageDrc.vue";
import PageHome from "./pages/PageHome.vue";
import "./styles.css";

/** app pages */
const routes = [
  {
    path: "/",
    component: PageHome,
    beforeEnter: () => {
      /** ignore dev */
      if (import.meta.env.DEV) return;

      /** get redirect path from 404.html */
      const redirect = window.sessionStorage.redirect as string;
      window.sessionStorage.removeItem("redirect");

      /** redirect to path */
      if (redirect) {
        console.debug("Redirecting to:", redirect);
        return redirect;
      }
    },
  },
  { path: "/core-projects", component: PageCoreProjects },
  { path: "/core-project/:id", component: PageCoreProject },
  { path: "/drc", component: PageDrc },
  { path: "/about", component: PageAbout },
];

const router = createRouter({ history: createWebHistory(), routes });

const app = createApp(App);
app.use(router);
if (import.meta.env.PROD)
  configure({ tagId: "G-ES3DWJYSXR", pageTracker: { router } });
app.use(VueQueryPlugin);
app.mount("#app");
