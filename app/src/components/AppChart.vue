<template>
  <v-chart class="chart" :option="option" autoresize />
</template>

<script setup lang="ts">
import { computed, provide } from "vue";
import VChart, { THEME_KEY } from "vue-echarts";
import type { EChartsOption } from "echarts";
import { PieChart } from "echarts/charts";
import { LegendComponent, TitleComponent } from "echarts/components";
import { use } from "echarts/core";
import { SVGRenderer } from "echarts/renderers";

type Props = {
  title: string;
  data: Record<string, number>;
};

const props = defineProps<Props>();

use([SVGRenderer, PieChart, TitleComponent, LegendComponent]);

provide(THEME_KEY, "light");

const option = computed(() => {
  const options: EChartsOption = {};

  options.animation = false;

  options.title = {
    text: props.title,
    right: 20,
    top: 20,
  };

  options.legend = {
    orient: "vertical",
    left: 20,
    top: 20,
    data: Object.keys(props.data).map((key) => key || "none"),
  };

  options.series = [
    {
      name: "",
      type: "pie",
      radius: "50%",
      center: ["50%", "65%"],
      data: Object.entries(props.data).map(([key, value]) => ({
        value,
        name: key || "none",
      })),
    },
  ];

  return options;
});
</script>

<style scoped>
.chart {
  box-shadow: var(--shadow);
}
</style>
