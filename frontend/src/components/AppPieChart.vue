<template>
  <v-chart ref="chart" v-if="data.length" class="chart" :option="options" />
</template>

<script setup lang="ts">
import { provide, ref, watchEffect, type ComponentInstance } from "vue";
import VChart, { THEME_KEY } from "vue-echarts";
import {
  type EChartsOption,
  type TitleComponentOption,
  type TooltipComponentOption,
} from "echarts";
import { PieChart, type PieSeriesOption } from "echarts/charts";
import { TitleComponent, TooltipComponent } from "echarts/components";
import { use } from "echarts/core";
import { SVGRenderer } from "echarts/renderers";
import { orderBy, sum, uniq } from "lodash";
import { useElementSize } from "@vueuse/core";
import { getCssVar } from "@/util/misc";
import { format } from "@/util/string";

type Props = {
  /** chart title */
  title: string;
  /** chart data */
  data: (readonly [string, number])[];
};

const { title, data } = defineProps<Props>();

const chart = ref<ComponentInstance<typeof VChart>>();
const { width, height } = useElementSize(() => chart.value?.root);
watchEffect(() => {
  /** manually resize */
  chart.value?.resize({
    width: width.value ?? 200,
    height: height.value ?? 200,
  });
});

use([SVGRenderer, PieChart, TitleComponent, TooltipComponent]);

provide(THEME_KEY, "light");

const gray = getCssVar("--light-gray");
const sans = getCssVar("--sans");

const options = ref<EChartsOption>({});

watchEffect(() => {
  options.value.animation = false;

  options.value.textStyle = {
    fontFamily: sans,
  };

  options.value.title = {
    text: title,
    right: "center",
    top: 15,
    textStyle: { fontSize: 16 },
  } satisfies TitleComponentOption;

  const values = uniq(data.map(([name]) => name));

  const pie = orderBy(
    values.map((name) => ({
      name: name.trim(),
      count: sum(data.filter(([n]) => n === name).map(([, count]) => count)),
    })),
    "count",
    "desc",
  );

  options.value.series = [
    {
      type: "pie",
      startAngle: 180,
      data: pie.map(({ name, count }) => ({
        name: `${format(count)} ${name || "-"}`,
        value: count,
        itemStyle: !name ? { color: gray } : {},
      })),
    } satisfies PieSeriesOption,
  ];

  options.value.tooltip = {
    trigger: "item",
    formatter: "{b}: {c} events ({d}%)",
  } satisfies TooltipComponentOption;
});
</script>

<style scoped>
.chart {
  width: 100%;
  height: unset;
}
</style>
