<template>
  <v-chart ref="chart" class="chart" :option="options" :group="group" />
</template>

<script setup lang="ts">
import { provide, ref, watchEffect, type ComponentInstance } from "vue";
import VChart, { THEME_KEY } from "vue-echarts";
import {
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  eachYearOfInterval,
  isAfter,
  isBefore,
  isEqual,
  max,
  min,
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

const props = withDefaults(defineProps<Props>(), {
  cumulative: false,
  yFormat: (value: number) =>
    value.toLocaleString(undefined, { notation: "compact" }),
  group: undefined,
});

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

const options = ref<EChartsOption>({});

/** connect chart zooms together */
watchEffect(() => props.group && connect(props.group));

watchEffect(() => {
  /** sum all values */
  const total = sum(props.data.map(([, value]) => value));

  /** get range of passed dates */
  const inputData = orderBy(props.data, ([date]) => date);
  const inputDates = inputData.map(([date]) => date);
  const start = min(inputDates);
  const end = max(inputDates);

  /** get date bins */
  let bins: Date[] = [];
  if (props.by === "year") bins = eachYearOfInterval({ start, end }, {});
  if (props.by === "month") bins = eachMonthOfInterval({ start, end });
  if (props.by === "week") bins = eachWeekOfInterval({ start, end });
  if (props.by === "day") bins = eachDayOfInterval({ start, end });

  /** init bin values to 0 */
  const data: [Date, number][] = bins.map((date) => [date, 0]);

  /** total values for binned dates */
  for (const [date, value] of inputData) {
    const index = bins.findIndex(
      (bin, index) =>
        /** is value >= lower bound of bin */
        (isEqual(bin, date) || isBefore(bin, date)) &&
        /** is value < upper bound of bin, or at last bin */
        (index === bins.length - 1 || isAfter(bins[index + 1]!, date)),
    );
    if (index !== -1) data[index]![1] += value;
  }

  /** accumulate values */
  if (props.cumulative)
    for (let index = 1; index < data.length; index++)
      data[index]![1] += data[index - 1]![1];

  /** whether to enable zoom controls */
  const zoom = props.data.length > 20;

  options.value.animation = false;

  options.value.title = {
    text: `${props.title}${props.cumulative ? " (cumulative)" : ""}`,
    subtext: `Total: ${props.yFormat(total)}`,
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
      formatter: props.yFormat,
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
      data,
    } satisfies SeriesOption,
  ];

  options.value.tooltip = {
    trigger: "axis",
    valueFormatter: (value: unknown) =>
      typeof value === "number" ? props.yFormat(value) : String(value),
  } satisfies TooltipComponentOption;
});
</script>

<style scoped>
.chart {
  width: 100%;
  height: unset;
}
</style>
