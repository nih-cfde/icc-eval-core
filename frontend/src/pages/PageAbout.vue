<template>
  <section>
    <AppHeading level="1">About</AppHeading>
  </section>

  <section>
    <AppHeading level="2">Who are we?</AppHeading>

    <p>
      The
      <AppLink to="https://commonfund.nih.gov/dataecosystem"
        >Common Fund Data Ecosystem (CFDE)</AppLink
      >
      is an effort to bring together knowledge across
      <AppLink to="https://commonfund.nih.gov/">NIH Common Fund</AppLink>
      programs into a cohesive resource.
    </p>

    <p>
      <AppLink to="#contact">The authors of this dashboard</AppLink> are part of
      the <strong>Integration and Coordination Center (ICC)</strong>, a center
      within the CFDE. We do not operate alone; we do this in close
      collaboration with the NIH and other groups.
    </p>
  </section>

  <section>
    <AppHeading level="2">What is this dashboard?</AppHeading>

    <p>
      The NIH has tasked us with (among other things) gathering info associated
      with Common Fund projects and making it more accessible by presenting it
      in a centralized way. This dashboard allows the NIH to see details of all
      projects in the program, allows the public to see an overview of project
      activity, and allows project leads to see summaries of their work more
      easily. Which specific pieces of info we gather is primarily decided by
      the NIH.
    </p>

    <p>
      <strong>This about page</strong> is written assuming
      <strong>you are a member</strong> of one of the projects displayed here,
      and addresses questions you might have.
    </p>
  </section>

  <section>
    <AppHeading level="2">What do we do with this info?</AppHeading>

    <p>
      We ourselves don't judge the projects presented here. We only gather info
      about them and share it with the appropriate parties. However, the NIH has
      indicated that the goal of this
      <strong>isn't to judge</strong>
      absolute numbers or compare across projects, it's to help them understand
      how certain activities lead to increased impact.
    </p>

    <p>
      If you have concerns about this, please reach out to the
      <AppLink to="#contact">NIH CFDE contacts below</AppLink>.
    </p>
  </section>

  <section>
    <AppHeading level="2">Who can see this info?</AppHeading>

    <p>
      First, there are two types of info we gather:
      <strong>standard info</strong> and <strong>extra info</strong>.
    </p>

    <p>
      <strong>Standard info</strong> are things like grant details,
      publications, and citations. These are
      <strong>already publicly available</strong> elsewhere, so we do not keep
      them private on the dashboard.
    </p>

    <p>
      <strong>Extra info</strong> are things like software repositories and
      website traffic. Because this is considered by some to be sensitive info,
      we keep it private with privileged access. This info is also
      <strong>opt-in</strong>; we won't know about it unless you
      <AppLink to="#opt-in-your-extra-info">tell us how to get it</AppLink>.
    </p>

    <p>
      This dashboard, as you can see, is available to anyone. It shows
      <strong>standard info</strong> for all projects. To see a project's
      <strong>extra info</strong>, you must be approved to view that project and
      then log in with your ORCID. Select members of the NIH are privileged to
      see <strong>everything</strong> for <strong>all projects</strong>.
    </p>

    <p>
      To
      <strong>see your own project's</strong>{{ " " }}
      <strong>extra info</strong>, please
      <AppLink to="#opt-in-your-extra-info">opt-in</AppLink>, then
      <AppLink to="#contact">contact us</AppLink> to request access.
    </p>
  </section>

  <section>
    <AppHeading level="2">How does it work?</AppHeading>

    <p>
      For transparency, all of the <strong>code</strong> we use for gathering
      info, storing, and building this dashboard is publicly visible in the
      <AppLink to="https://github.com/nih-cfde/icc-eval-core"
        >GitHub nih-cfde/icc-eval-core repository</AppLink
      >.
    </p>

    <p>
      Here is a high-level overview of <strong>what info we gather</strong> and
      <strong>where we gather it from</strong>. All parts of this process are
      automatic, except parts marked with ✍️ which need some manual action.
    </p>

    <details @toggle="toggle">
      <summary>Diagram</summary>

      <pre class="mermaid">
      flowchart
        subgraph g2["<b>Extra info</b>, possibly sensitive"]
          direction TB
          n5("
            ✍️ <b>Tag</b> your properties with project # and grant us access
          "):::node
          n6("
            <b>📈 Analytics</b>
            Page views, new users, top regions, etc.
            <i>analyticsdata.googleapis.com</i>
          "):::node
          n7("
            ✍️ <b>Tag</b> your repos with project #
          "):::node
          n8("
            <b>💽 Repos</b>
            Stars, commits, issues, PRs, etc.
            <i>api.github.com</i>
          "):::node
        end
        subgraph g1["<b>Standard info</b>, already public, non-sensitive"]
          direction TB
          n1("
            <b>🔬 Projects</b>
            #/ID, activ. code, etc.
            <i>commonfund.nih.gov</i>
          "):::node
          n2("
            <b>🪪 Project details</b>
            Name, award $, dates, etc.
            <i>api.reporter.nih.gov</i>
          "):::node
          n3("
            <b>📖 Publications</b>
            Title, authors, dates, citations, etc.
            <i>icite.od.nih.gov</i>
            <i>api.reporter.nih.gov</i>
          "):::node
          n4("
            <b>📚 Journals</b>
            <i>eutils.ncbi.nlm.nih.gov</i>
            <i>scimagojr.com</i>
          "):::node
        end
        n9("Structured JSON"):::node
        n10("Database"):::node
        n11("Backend"):::node
        subgraph g3["Dashboard/API"]
          direction TB
          n10("
            <b>Standard Info</b>, all projects
            Viewable by anyone
          "):::node
          n11("
            <b>Extra Info</b>, per project
            Only viewable by ✍️ approved ORCIDs
          "):::node
        end
        g1:::group
        g2:::group
        g3:::group
        n1 --> n2
        n2 --> n3
        n3 --> n4
        n5 --> |Get properties we have access to| n6
        n7 --> |Search whole site for project # tags| n8
        g1 --> |Linked to projects with tag #s| n9
        g2 --> |Linked to projects with tag #s| n9
        n9 --> g3
        classDef group color:black,stroke-width:0px,fill:aliceblue,white-space:nowrap
        classDef node color:black,stroke-width:0px,fill:#e0e8ef
        linkStyle default color:black,stroke:black
        linkStyle 6 white-space:nowrap;
      </pre>
    </details>
  </section>

  <section>
    <AppHeading level="2">Opt-in your extra info</AppHeading>

    <p>
      Most of what we gather is already done automatically through public
      resources like
      <AppLink to="https://icite.od.nih.gov/api">iCite</AppLink>. But there is
      certain <strong>extra info</strong> that
      <strong>we can't gather automatically</strong>. Currently, this just means
      we need you to manually tag some things with your core project numbers so
      we can associate them together. We've tried to make this process as
      <strong>easy and minimal as possible</strong>. If you already know your
      numbers/accounts/etc., it should only take a few minutes.
    </p>

    <p>
      Why do this? One set of metrics can't fully represent your work, but the
      more you share, the fuller picture you can paint. Imagine you hold an
      event where you discuss your work and share public links to it. You might
      see a spike in your website traffic the week after the event. With the
      help of this dashboard, the NIH can see the direct impact of that
      immediately and conveniently.
    </p>

    <p>
      <strong>Before following the instructions below</strong>... Don't confuse
      <strong>CORE</strong> project numbers with
      <strong>PROJECT</strong> numbers:
    </p>

    <table>
      <tbody>
        <tr>
          <td>✅</td>
          <td><strong>USE</strong></td>
          <td><strong>CORE</strong> project numbers</td>
          <td>e.g. <code>U54OD036472</code></td>
          <td>(shorter)</td>
        </tr>
        <tr>
          <td>❌</td>
          <td><strong>DON'T</strong> use</td>
          <td>"sub" <strong>PROJECT</strong> numbers</td>
          <td>e.g. <code>1U54OD036472-01</code></td>
          <td>(longer)</td>
        </tr>
      </tbody>
    </table>

    <AppHeading level="3">Software repositories</AppHeading>

    <p>
      Repositories ("repos") are places for storing, tracking changes to, and
      collaborating on software. Currently, we only take software kept in
      <strong>public GitHub</strong> repos. Private repos and other platforms
      such as GitLab aren't supported yet.
    </p>

    <details>
      <summary><strong>Instructions</strong></summary>
      <ol>
        <li>
          Find all <strong>public GitHub repos</strong> associated with your
          project.
          <ol>
            <li>
              If you're unsure where to find these, ask members of your team
              about any software that was written in support of it, and where
              its code resides.
            </li>
          </ol>
        </li>
        <li>
          <strong>"Tag"</strong> each repo with your
          <strong>core</strong> project number.
          <ol>
            <li>
              See
              <AppLink
                to="https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics"
                >GitHub's instructions for tagging repos</AppLink
              >
              for reference.
            </li>
            <li>
              On the main page of the repo, click on the gear ⚙ next to "About".
            </li>
            <li>
              Under "Topics", enter your
              <strong>core</strong> project number.
            </li>
          </ol>
        </li>
      </ol>
    </details>

    <AppHeading level="3">Analytics</AppHeading>

    <p>
      Analytics are services that monitor traffic (number of visits over time,
      visitor demographics, etc.) on public webpages. Currently, we only take
      webpages using
      <strong>Google Analytics</strong>. Other analytics services may be
      supported in the future.
    </p>

    <details>
      <summary>
        <strong>Instructions</strong>
      </summary>

      <ol>
        <li>
          Find all <strong>Google Analytics properties</strong> associated with
          your project.
          <ol>
            <li>
              If you're unsure where to find these, ask members of your project
              about any webpages related to it, and if anyone set up analytics
              for them.
            </li>
          </ol>
        </li>
        <li>
          Give us <strong>basic read-only access</strong> to each property.
          <ol>
            <li>
              Go to the
              <AppLink to="https://analytics.google.com/"
                >Google Analytics dashboard</AppLink
              >
              and make sure you are
              <AppLink
                to="https://support.google.com/analytics/answer/10252712?hl=en"
                >on the right property</AppLink
              >.
            </li>
            <li>
              Find "Property Access Management" from the main search bar (or the
              "Admin" side menu).
            </li>
            <li>
              Add a new user with the email
              <code
                >api-access@cfde-icc-eval-core-433116.iam.gserviceaccount.com</code
              >, uncheck "Notify by email", and select the "Viewer" role.
            </li>
          </ol>
        </li>
        <li>
          <strong>"Tag"</strong> each property so we can associate it with a
          particular <strong>core</strong> project.
          <ol>
            <li>Go to "Admin" → "Data Display" → "Custom definitions".</li>
            <li>
              Create a new custom dimension with the name
              <code>cfde_XXX</code> (case-insensitive), where XXX is your
              <strong>core</strong> project number, e.g.
              <code>cfde_U54OD036472</code>. The rest of the options can be set
              to anything.
            </li>
          </ol>
        </li>
      </ol>
    </details>
  </section>

  <section>
    <AppHeading level="2">Contact</AppHeading>

    <ul>
      <li>
        <AppLink to="mailto:christy.kano@nih.gov">Christy Kano</AppLink> &ndash;
        NIH CFDE lead
      </li>
      <li>
        <AppLink to="mailto:casey.s.greene@cuanschutz.edu"
          >Casey Greene</AppLink
        >
        &ndash; ICC lead
      </li>
      <li>
        <AppLink to="mailto:sean.2.davis@cuanschutz.edu">Sean Davis</AppLink>
        &ndash; ICC lead
      </li>
      <li>
        <AppLink to="mailto:vincent.rubinetti@cuanschutz.edu"
          >Vincent Rubinetti</AppLink
        >
        &ndash; ICC software developer
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { useScriptTag } from "@vueuse/core";
import AppHeading from "@/components/AppHeading.vue";
import AppLink from "@/components/AppLink.vue";

useScriptTag("https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js");

declare global {
  // eslint-disable-next-line
  interface Window {
    mermaid?: {
      run: () => void;
    };
  }
}

const toggle = () => window.mermaid?.run();
</script>

<style scoped>
section {
  --content: 600px;
  align-items: stretch;
}
</style>
