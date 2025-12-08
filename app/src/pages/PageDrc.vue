<template>
  <section>
    <AppHeading level="1"><Data />Data Resource Center</AppHeading>
  </section>

  <template
    v-for="([label, { count, size, types }], key) in overview"
    :key="key"
  >
    <section class="narrow">
      <AppHeading level="2">{{ label }}</AppHeading>

      <dl class="details">
        <div>
          <dt>Files</dt>
          <dd>{{ count.toLocaleString() }}</dd>
        </div>
        <div>
          <dt>Size</dt>
          <dd>{{ bytes(size) }}</dd>
        </div>
        <div>
          <dt>Types</dt>
          <dd>
            <span v-for="[type, number] in types" :key="type" class="file-type">
              {{ number.toLocaleString() }}
              <template v-if="type">.{{ type }}</template>
              <i v-else>no ext</i>
            </span>
          </dd>
        </div>
      </dl>
    </section>
  </template>
</template>

<script setup lang="ts">
import { countBy, orderBy, sumBy } from "lodash";
import Data from "@/assets/data.svg";
import AppHeading from "@/components/AppHeading.vue";
import { bytes } from "@/util/string";
import code from "~/drc-code.json";
import dcc from "~/drc-dcc.json";
import file from "~/drc-file.json";

/** get total values for resources */
const getTotals = (resources: (typeof dcc | typeof file | typeof code)[]) => {
  const files = resources
    .map((resource) => resource.map((entry) => entry.files))
    .flat()
    .flat();

  return {
    /** number of files */
    count: files.length,
    /** uncompressed size of files */
    size: sumBy(files, "size"),
    /** extensions/types of files */
    types: orderBy(Object.entries(countBy(files, "path.ext")), [1], ["desc"]),
  };
};

const overview = [
  ["Total", getTotals([dcc, file, code])] as const,
  ["DCC", getTotals([dcc])] as const,
  ["File", getTotals([file])] as const,
];
</script>

<style scoped>
.file-type {
  display: inline-block;
  margin: 2px 2px;
  padding: 0 4px;
  border-radius: var(--rounded);
  background: var(--light-gray);
  white-space: nowrap;
}
</style>
