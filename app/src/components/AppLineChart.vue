<template>
  <v-chart ref="chart" class="chart" :option="option" />
</template>

<script setup lang="ts">
import {
  computed,
  provide,
  ref,
  watchEffect,
  type ComponentInstance,
} from "vue";
import VChart, { THEME_KEY } from "vue-echarts";
import type { EChartsOption } from "echarts";
import { LineChart } from "echarts/charts";
import {
  GridComponent,
  TitleComponent,
  TooltipComponent,
} from "echarts/components";
import { use } from "echarts/core";
import { SVGRenderer } from "echarts/renderers";
import { sum } from "lodash";
import { useElementSize } from "@vueuse/core";

const chart = ref<ComponentInstance<typeof VChart>>();
const { width, height } = useElementSize(() => chart.value?.root);
watchEffect(() => {
  /** manually resize */
  chart.value?.resize({ width: width.value, height: height.value });
});

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

const props = defineProps<Props>();

use([SVGRenderer, LineChart, TitleComponent, GridComponent, TooltipComponent]);

provide(THEME_KEY, "light");

const option = computed(() => {
  const options: EChartsOption = {};

  options.animation = false;

  options.title = {
    text: props.title,
    right: "center",
    top: 20,
  };

  options.grid = {
    left: 60,
    top: 80,
    bottom: 50,
    right: 50,
  };

  options.xAxis = {
    type: "category",
    boundaryGap: false,
    data: Object.keys(props.data),
  };

  options.yAxis = {
    type: "value",
    axisLabel: {
      formatter: props.yFormat,
    },
  };

  options.series = [
    {
      areaStyle: {},
      type: "line",
      data: props.cumulative
        ? Object.values(props.data).map((_, index) =>
            sum(Object.values(props.data).slice(0, index + 1)),
          )
        : Object.values(props.data),
    },
  ];

  options.tooltip = {
    trigger: "item",
    valueFormatter: (value) => value?.toLocaleString() ?? "",
    // type: "axis",
    // axisPointer: {
    //   type: "cross",
    // },
  };

  return options;
});
</script>

<style scoped>
.chart {
  width: 100%;
  height: unset;
}
</style>
