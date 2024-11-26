<template>
  <v-chart ref="chart" class="chart" :option="options" />
</template>

<script setup lang="ts">
import { provide, ref, watchEffect, type ComponentInstance } from "vue";
import VChart, { THEME_KEY } from "vue-echarts";
import type { EChartsOption } from "echarts";
import { LineChart } from "echarts/charts";
import {
  DataZoomComponent,
  GridComponent,
  TitleComponent,
  TooltipComponent,
} from "echarts/components";
import { use } from "echarts/core";
import { SVGRenderer } from "echarts/renderers";
import { sum } from "lodash";
import { useElementSize } from "@vueuse/core";
import { getCssVar } from "@/util/misc";

type Props = {
  /** chart title */
  title: string;
  /** chart data */
  data: Record<string | number, number>;
  /** whether to sum previous values */
  cumulative?: boolean;
  /** y-axis label formatter */
  yFormat?: (value: number) => string;
};

const props = withDefaults(defineProps<Props>(), {
  cumulative: false,
  yFormat: (value: number) => value.toLocaleString(),
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

watchEffect(() => {
  options.value.animation = false;

  options.value.title = {
    text: `${props.title}${props.cumulative ? " (cumulative)" : ""}`,
    subtext: `Total: ${props.yFormat(sum(Object.values(props.data)))}`,
    right: "center",
    top: 15,
    textStyle: { fontSize: 16 },
    subtextStyle: { fontSize: 14 },
  };

  const zoom = Object.keys(props.data).length > 100;

  options.value.grid = {
    left: 60,
    top: 80,
    bottom: zoom ? 80 : 50,
    right: 50,
  };

  if (zoom) options.value.dataZoom = [{ xAxisIndex: 0 }];

  options.value.xAxis = {
    type: "category",
    boundaryGap: false,
    data: Object.keys(props.data),
  };

  options.value.yAxis = {
    type: "value",
    axisLabel: {
      formatter: props.yFormat,
    },
  };

  options.value.series = [
    {
      showSymbol: false,
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
      data: props.cumulative
        ? Object.values(props.data).map((_, index) =>
            sum(Object.values(props.data).slice(0, index + 1)),
          )
        : Object.values(props.data),
    },
  ];

  options.value.tooltip = {
    trigger: "axis",
    valueFormatter: (value) =>
      typeof value === "number" ? props.yFormat(value) : String(value),
    // type: "axis",
    // axisPointer: {
    //   type: "cross",
    // },
  };
});
</script>

<style scoped>
.chart {
  width: 100%;
  height: unset;
}
</style>
