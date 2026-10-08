<template>
  <v-chart ref="chart" v-if="data.length" class="chart" :option="options" />
</template>

<script setup lang="ts">
import { provide, ref, watchEffect, type ComponentInstance } from "vue";
import VChart, { THEME_KEY } from "vue-echarts";
import {
  type EChartsOption,
  type GridComponentOption,
  type SeriesOption,
  type TitleComponentOption,
  type TooltipComponentOption,
  type XAXisComponentOption,
  type YAXisComponentOption,
} from "echarts";
import { LineChart } from "echarts/charts";
import {
  GridComponent,
  TitleComponent,
  TooltipComponent,
} from "echarts/components";
import { use } from "echarts/core";
import { SVGRenderer } from "echarts/renderers";
import { useElementSize } from "@vueuse/core";
import { getCssVar } from "@/util/misc";
import { format } from "@/util/string";

type Props = {
  /** chart title */
  title: string;
  /** x-axis label */
  xLabel: string;
  /** y-axis label */
  yLabel: string;
  /** chart data (raw values to be binned) */
  data: number[];
  /** absolute size of each bin, in same units as values */
  binSize: number;
};

const { title, xLabel, yLabel, data, binSize } = defineProps<Props>();

const chart = ref<ComponentInstance<typeof VChart>>();
const { width, height } = useElementSize(() => chart.value?.root);
watchEffect(() => {
  /** manually resize */
  chart.value?.resize({
    width: width.value ?? 200,
    height: height.value ?? 200,
  });
});

use([SVGRenderer, LineChart, TitleComponent, GridComponent, TooltipComponent]);

provide(THEME_KEY, "light");

const theme = getCssVar("--theme");
const sans = getCssVar("--sans");

const options = ref<EChartsOption>({});

watchEffect(() => {
  /** ignore non-finite values and guard against invalid bin size */
  const values = data.filter((value) => Number.isFinite(value));
  const size = binSize > 0 ? binSize : 1;

  /** bin index of each value */
  const indices = values.map((value) => Math.floor(value / size));
  const first = indices.length ? Math.min(...indices) : 0;
  const last = indices.length ? Math.max(...indices) : 0;

  /** init all bins (including empty ones in between) to 0 */
  const bins = Array.from({ length: last - first + 1 }, (_, index) => ({
    start: (first + index) * size,
    end: (first + index + 1) * size,
    count: 0,
  }));

  /** count values into bins */
  for (const index of indices) {
    const bin = bins[index - first];
    if (bin) bin.count++;
  }

  options.value.animation = false;

  options.value.textStyle = {
    fontFamily: sans,
  };

  options.value.title = {
    text: title,
    subtext: `Total: ${format(values.length)}`,
    right: "center",
    top: 15,
    textStyle: { fontSize: 16 },
    subtextStyle: { fontSize: 14 },
  } satisfies TitleComponentOption;

  options.value.grid = {
    left: 70,
    top: 80,
    bottom: 50,
    right: 50,
  } satisfies GridComponentOption;

  options.value.xAxis = {
    type: "category",
    name: xLabel,
    nameLocation: "middle",
    nameGap: 30,
    data: bins.map(({ start }) => format(start)),
    axisLabel: { formatter: (value: string) => value },
  } satisfies XAXisComponentOption;

  options.value.yAxis = {
    type: "value",
    name: yLabel,
    nameLocation: "middle",
    nameGap: 45,
    axisLabel: { formatter: (value: number) => format(value, true) },
  } satisfies YAXisComponentOption;

  options.value.series = [
    {
      type: "line",
      data: bins.map(({ count }) => count),
      areaStyle: { color: theme, opacity: 0.25 },
      lineStyle: { color: theme },
      itemStyle: { color: theme },
    } satisfies SeriesOption,
  ];

  options.value.tooltip = {
    trigger: "axis",
    formatter: (params) => {
      const [param] = [params].flat();
      const bin = bins[param?.dataIndex ?? -1];
      if (!param || !bin) return "";
      return `${format(bin.start)} – ${format(bin.end)}<br/>${param.marker} ${yLabel}: <b>${format(bin.count)}</b>`;
    },
  } satisfies TooltipComponentOption;
});
</script>

<style scoped>
.chart {
  width: 100%;
  height: unset;
}
</style>
