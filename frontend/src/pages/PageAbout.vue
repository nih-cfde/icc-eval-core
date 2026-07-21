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
      the Integration and Coordination Center (ICC), a center within the CFDE.
    </p>

    <p>
      We do not operate alone; we do this in close collaboration with the NIH
      and other CFDE centers.
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
      easily.
    </p>

    <p>
      The specific pieces of info we gather are requested by the NIH primarily,
      but also decided upon in collaboration with other groups.
    </p>
  </section>

  <section>
    <AppHeading level="2">What do we do with this info?</AppHeading>

    <p>
      We ourselves don't judge the projects presented here. We only gather info
      about them and share it with the appropriate parties.
    </p>

    <p>
      However, the NIH has indicated that the goal of this isn't to judge
      absolute numbers or compare across projects, it's to help program staff
      understand how certain activities lead to increased impact.
    </p>

    <p>
      If you have concerns about this, please reach out to the
      <AppLink to="#contact">NIH CFDE contacts below</AppLink>.
    </p>
  </section>

  <section>
    <AppHeading level="2" id="contact">Who can see this info?</AppHeading>

    <p>
      First, there are two types of info we gather: <em>standard info</em> and
      <em>extra info</em>.
    </p>

    <p>
      <em>Standard info</em> are things like grant details, publications, and
      citations. These are <em>already publicly available</em>, so we do not
      keep them private on the dashboard.
    </p>

    <p>
      <em>Extra info</em> are things like software repositories and website
      traffic. Because some consider this sensitive info, we keep it private
      with privileged access. This info is also <strong>opt-in</strong>; we
      won't know about it unless you
      <AppLink to="#provide-your-extra-info">tell us how to get it</AppLink>.
    </p>

    <p>
      This dashboard, as you can see, is available to anyone. It shows
      <em>standard info</em> for all projects. To see a project's
      <em>extra info</em>, you must log in with your ORCID and be approved to
      view that project. Select members of the NIH are privileged to see
      <em>everything</em> for <em>all projects</em>.
    </p>

    <p>
      To
      <strong>see your own project's</strong>{{ " " }} <em>extra info</em>,
      please <AppLink to="#provide-your-extra-info">provide it</AppLink> then
      <AppLink to="#contact">contact us</AppLink> to request access.
    </p>
  </section>

  <section>
    <AppHeading level="2">How does it work?</AppHeading>

    <p>
      For transparency, all of the <em>code</em> we use for gathering info,
      storing, and building this dashboard is publicly visible in the
      <AppLink to="https://github.com/nih-cfde/icc-eval-core"
        >GitHub nih-cfde/icc-eval-core repository</AppLink
      >, but the <em>info gathered</em> from running it is kept private.
    </p>

    <p>
      Here is a high-level overview of <strong>what info we gather</strong> and
      <strong>where we gather it from</strong>. All parts of this process are
      automatic, except parts marked with ✍️ which need some manual action.
    </p>

    <details>
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
    <AppHeading level="2">Provide your extra info</AppHeading>

    <p>
      Most of what we gather is already done automatically through public
      resources like
      <AppLink to="https://icite.od.nih.gov/api">iCite</AppLink>. But there is
      certain <em>extra info</em> that
      <strong>we can't gather automatically</strong>. Currently, this just means
      we need you to manually tag some things with your project numbers so we
      can associate them together. We've tried to make this process as
      <em>easy and minimal as possible</em>. If you already know your project
      numbers, it should only take a few minutes.
    </p>

    <p>
      Why do this? One set of metrics can't fully represent your work, but the
      more you share the fuller picture you can paint. Imagine you hold an event
      where you discuss your work and share public links to it. You might see a
      spike in your Google Analytics the week after the event. With the help of
      the dashboard, the NIH could see the direct impact of that immediately and
      conveniently.
    </p>

    <AppHeading level="3">Software repositories</AppHeading>

    <p>
      Repositories ("repos") are places for storing, tracking changes to, and
      collaborating on software. Currently, we only take software kept in
      <strong>public GitHub</strong> repos. Private repos and other platforms
      such as GitLab aren't supported yet.
    </p>

    <details>
      <summary>
        <strong>Instructions</strong>, How to provide your GitHub repos
      </summary>
      <ol>
        <li>
          Find all GitHub repos that are associated with your project.
          <ol>
            <li>
              If you're unsure where to find these, ask members of your project
              about any software that was written in support of it, and where
              the code for the software resides.
            </li>
          </ol>
        </li>
        <li>
          "Tag" each repo with the project.
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
              Under "Topics", type in your
              <em><strong>core</strong> project number</em>, e.g.
              <code>U54OD036472</code> (case-insensitive). Don't confuse this
              with a (sub) "project" number, which is longer, e.g.
              <code>1U54OD036472-01</code>.
            </li>
          </ol>
        </li>
      </ol>
    </details>

    <AppHeading level="3">Analytics</AppHeading>

    <p>
      Analytics are services that monitor traffic (number of visits over time,
      number of unique visitors, visitor demographics, etc.) on public webpages.
      Currently, we only take webpages using
      <strong>Google Analytics</strong>. Other analytics services may be
      supported in the future.
    </p>

    <details>
      <summary>
        <strong>Instructions</strong>, How to provide your Google Analytics
      </summary>
      <ol>
        <li>
          Find all Google Analytics properties that are associated with your
          project.
          <ol>
            <li>
              If you're unsure where to find these, ask members of your project
              about any webpages related to it, and if anyone set up analytics
              for them.
            </li>
          </ol>
        </li>
        <li>
          Give us read access to each property.
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
          "Tag" each property so we can associate it with a particular project.
          <ol>
            <li>Go to "Admin" → "Data Display" → "Custom definitions".</li>
            <li>
              Create a new custom dimension with the name
              <code>cfde_XXX</code> (case-insensitive), where XXX is your
              <em><strong>core</strong> project number</em>, e.g.
              <code>cfde_U54OD036472</code>. Don't confuse this with a (sub)
              "project" number, which is longer, e.g.
              <code>1U54OD036472-01</code>. The rest of the options can be set
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
        <AppLink to="mailto:christy.kano@nih.gov">Christy Kano</AppLink> - NIH
        CFDE contact
      </li>
      <li>
        <AppLink to="mailto:casey.s.greene@cuanschutz.edu"
          >Casey Greene</AppLink
        >
        - Evaluation Core Lead
      </li>
      <li>
        <AppLink to="mailto:sean.2.davis@cuanschutz.edu">Sean Davis</AppLink> -
        Evaluation Core Lead
      </li>
      <li>
        <AppLink to="mailto:vincent.rubinetti@cuanschutz.edu"
          >Vincent Rubinetti</AppLink
        >
        - Software developer
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { useScriptTag } from "@vueuse/core";
import AppHeading from "@/components/AppHeading.vue";
import AppLink from "@/components/AppLink.vue";

useScriptTag("https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js");
</script>

<style scoped>
section {
  --content: 600px;
  align-items: stretch;
}
</style>
