<template>
  <v-chart
    ref="chart"
    v-if="data.length"
    class="chart"
    :option="options"
    :group="group"
  />
</template>

<script setup lang="ts">
import { provide, ref, watchEffect, type ComponentInstance } from "vue";
import VChart, { THEME_KEY } from "vue-echarts";
import {
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  eachYearOfInterval,
} from "date-fns";
import {
  connect,
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
  DataZoomComponent,
  GridComponent,
  TitleComponent,
  TooltipComponent,
} from "echarts/components";
import { use } from "echarts/core";
import { SVGRenderer } from "echarts/renderers";
import { orderBy, sum } from "lodash";
import { useElementSize } from "@vueuse/core";
import { getCssVar } from "@/util/misc";
import { format } from "@/util/string";

type Props = {
  /** chart title */
  title: string;
  /** chart data */
  data: (readonly [Date, number])[];
  /** whether to sum previous values */
  cumulative?: boolean;
  /** y-axis label formatter */
  yFormat?: (value: number) => string;
  /** level of date binning */
  by: "year" | "month" | "week" | "day";
  /** "connect" charts together (sync things like zoom controls) */
  group?: string;
};

const {
  title,
  data,
  cumulative = false,
  yFormat = (value: number) => format(value, true),
  by,
  group = undefined,
} = defineProps<Props>();

const chart = ref<ComponentInstance<typeof VChart>>();
const { width, height } = useElementSize(() => chart.value?.root);
watchEffect(() => {
  /** manually resize */
  chart.value?.resize({
    width: width.value ?? 200,
    height: height.value ?? 200,
  });
});

use([
  SVGRenderer,
  LineChart,
  TitleComponent,
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
]);

provide(THEME_KEY, "light");

const theme = getCssVar("--theme");
const sans = getCssVar("--sans");

const options = ref<EChartsOption>({});

/** connect chart zooms together */
watchEffect(() => group && connect(group));

watchEffect(() => {
  /** sum all values */
  const total = sum(data.map(([, value]) => value));

  /** sort dates from earliest to latest */
  const inputData = orderBy(data, ([date]) => date);

  /** get range of passed dates */
  const inputDates = inputData.map(([date]) => date);
  const start = inputDates.at(0);
  const end = inputDates.at(-1);

  /** get date bins */
  let bins: Date[] = [];
  if (start && end) {
    if (by === "year") bins = eachYearOfInterval({ start, end }, {});
    if (by === "month") bins = eachMonthOfInterval({ start, end });
    if (by === "week") bins = eachWeekOfInterval({ start, end });
    if (by === "day") bins = eachDayOfInterval({ start, end });
  }

  /** init bin values to 0 */
  const binned: [Date, number][] = bins.map((date) => [date, 0]);

  /** total values for binned dates, assume sorted */
  let index = 0;
  for (const [date, value] of inputData) {
    /** move to next bin */
    while (date >= (bins[index + 1] ?? Infinity) && index < bins.length - 1)
      index++;
    /** accumulate value */
    const bin = binned[index];
    if (bin) bin[1] += value;
  }

  /** accumulate values */
  if (cumulative)
    for (let index = 1; index < binned.length; index++) {
      const bin = binned[index];
      const prev = binned[index - 1];
      if (bin && prev) bin[1] += prev[1];
    }

  /** whether to enable zoom controls */
  const zoom = data.length > 20;

  options.value.animation = false;

  options.value.textStyle = {
    fontFamily: sans,
  };

  options.value.title = {
    text: `${title}${cumulative ? " (cumulative)" : ""}`,
    subtext: `Total: ${yFormat(total)}`,
    right: "center",
    top: 15,
    textStyle: { fontSize: 16 },
    subtextStyle: { fontSize: 14 },
  } satisfies TitleComponentOption;

  options.value.grid = {
    left: 60,
    top: 80,
    bottom: 50,
    right: 50,
  } satisfies GridComponentOption;

  if (zoom)
    options.value.dataZoom = [
      { xAxisIndex: 0, filterMode: "none", type: "inside" },
    ];

  options.value.xAxis = {
    type: "time",
    axisLabel: { showMaxLabel: true },
  } satisfies XAXisComponentOption;

  options.value.yAxis = {
    type: "value",
    axisLabel: {
      formatter: yFormat,
    },
  } satisfies YAXisComponentOption;

  options.value.series = [
    {
      areaStyle: {
        color: theme,
        opacity: 0.25,
      },
      lineStyle: {
        color: theme,
      },
      itemStyle: {
        color: theme,
      },
      type: "line",
      data: binned,
    } satisfies SeriesOption,
  ];

  options.value.tooltip = {
    trigger: "axis",
    valueFormatter: (value: unknown) =>
      typeof value === "number" ? yFormat(value) : String(value),
  } satisfies TooltipComponentOption;
});
</script>

<style scoped>
.chart {
  width: 100%;
  height: unset;
}
</style>
