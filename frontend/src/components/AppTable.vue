<template>
  <div class="container">
    <div v-if="!printing" class="controls">
      <AppButton
        :disabled="!table.getCanPreviousPage()"
        aria-label="First page"
        @click="table.setPageIndex(0)"
      >
        <AnglesLeft />
      </AppButton>
      <AppButton
        :disabled="!table.getCanPreviousPage()"
        aria-label="Previous page"
        @click="table.previousPage()"
      >
        <AngleLeft />
      </AppButton>

      {{ table.getState().pagination.pageIndex + 1 }} of
      {{ table.getPageCount() }}

      <AppButton
        :disabled="!table.getCanNextPage()"
        aria-label="Next page"
        @click="table.nextPage()"
      >
        <AngleRight />
      </AppButton>
      <AppButton
        :disabled="!table.getCanNextPage()"
        aria-label="Last page"
        @click="table.setPageIndex(table.getPageCount() - 1)"
      >
        <AnglesRight />
      </AppButton>

      <label>
        Show
        <AppSelect
          :modelValue="table.getState().pagination.pageSize as 10"
          @update:modelValue="(value) => table.setPageSize(value ?? 10)"
          :options="
            [
              { value: 5 },
              { value: 10 },
              { value: 25 },
              { value: 50 },
              { value: 100 },
              { value: 9999, label: 'All' },
            ] as const
          "
        />
      </label>
    </div>
    <div class="scroll">
      <table>
        <thead>
          <tr
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
          >
            <th
              v-for="header in headerGroup.headers"
              :key="header.id"
              :colSpan="header.colSpan"
            >
              <button
                class="th"
                :style="{
                  ...cellStyle(header.column.columnDef.meta?.colProp),
                }"
                v-bind="cellAttrs(header.column.columnDef.meta?.colProp)"
                @click="header.column.getToggleSortingHandler()?.($event)"
              >
                <FlexRender
                  :render="header.column.columnDef.header"
                  :props="header.getContext()"
                />
                <SortDown
                  v-if="header.column.getIsSorted() === 'desc'"
                  class="icon-active"
                />
                <SortUp
                  v-else-if="header.column.getIsSorted() === 'asc'"
                  class="icon-active"
                />
                <Sort v-else class="icon-inactive" />
              </button>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="row in table.getRowModel().rows" :key="row.id">
            <td v-for="cell in row.getVisibleCells()" :key="cell.id">
              <div
                class="td"
                :style="{
                  ...cellStyle(cell.column.columnDef.meta?.colProp),
                }"
                v-bind="
                  cellAttrs(cell.column.columnDef.meta?.colProp, row.original)
                "
              >
                <slot
                  v-if="
                    cell.column.columnDef.meta?.colProp.slot &&
                    $slots[cell.column.columnDef.meta?.colProp.slot]
                  "
                  :name="cell.column.columnDef.meta?.colProp.slot"
                  :row="row.original"
                />
                <template v-else>
                  {{ format(cell.getValue()) }}
                </template>
              </div>
            </td>
          </tr>

          <tr v-if="!table.getRowModel().rows.length">
            <td class="empty" :colspan="cols.length">No data</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts">
type Cell = Record<string, unknown>;

export type Cols<Rows extends Cell[] = Cell[]> = {
  /** key of row object to access as default cell value */
  key: Extract<keyof Rows[number], string>;
  /** slot name for custom cell rendering */
  slot?: string;
  /** label for header */
  name: string;
  /** horizontal alignment */
  align?: "left" | "center" | "right";
  /** cell attributes */
  attrs?: HTMLAttributes | ((row?: Rows[number]) => HTMLAttributes);
  /** cell style */
  style?: CSSProperties;
}[];

declare module "@tanstack/vue-table" {
  // eslint-disable-next-line
  interface ColumnMeta<TData extends RowData, TValue> {
    colProp: Cols<Cell[]>[number];
  }
}
</script>

<script setup lang="ts" generic="Rows extends Cell[]">
import {
  computed,
  type CSSProperties,
  type HTMLAttributes,
  type VNode,
} from "vue";
import {
  createColumnHelper,
  FlexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
  type Row as TanstackRow,
} from "@tanstack/vue-table";
import type { RowData, SortingFn, SortingState } from "@tanstack/vue-table";
import { useMediaQuery } from "@vueuse/core";
import AngleLeft from "@/assets/angle-left.svg";
import AngleRight from "@/assets/angle-right.svg";
import AnglesLeft from "@/assets/angles-left.svg";
import AnglesRight from "@/assets/angles-right.svg";
import SortDown from "@/assets/sort-down.svg";
import SortUp from "@/assets/sort-up.svg";
import Sort from "@/assets/sort.svg";
import AppButton from "@/components/AppButton.vue";
import AppSelect from "@/components/AppSelect.vue";
import { format } from "@/util/string";

type Props = {
  cols: Cols<Rows>;
  rows: Rows;
  sort?: SortingState;
};

const props = defineProps<Props>();

type SlotNames = string;

type Row = Rows[number];

defineSlots<{
  [slot in SlotNames]: ({ row }: { row: Row }) => VNode;
}>();

const columnHelper = createColumnHelper<Row>();

/** custom sorting function */
const sortingFunction: SortingFn<Row> = (
  a: TanstackRow<Row>,
  b: TanstackRow<Row>,
  columnId: string,
) => {
  /** get row values */
  const aValue = a.getValue<Required<unknown>>(columnId);
  const bValue = b.getValue<Required<unknown>>(columnId);
  /** compare arrays by length */
  const aCompare = Array.isArray(aValue) ? aValue.length : aValue;
  const bCompare = Array.isArray(bValue) ? bValue.length : bValue;
  /** basic compare */
  if (aCompare < bCompare) return -1;
  if (aCompare > bCompare) return 1;
  return 0;
};

/** column definitions */
const columns = computed(() =>
  props.cols.map((col) =>
    columnHelper.accessor((row: Row) => row[col.key], {
      /** unique column id */
      id: col.key,
      /** name */
      header: col.name,
      /** sortable */
      enableSorting: true,
      /** sorting function */
      sortingFn: sortingFunction,
      /** put nullish values lower */
      sortUndefined: -1,
      /** extra metadata */
      meta: {
        colProp: col,
      },
    }),
  ),
);

const printing = useMediaQuery("print");

/** note: https://github.com/TanStack/table/issues/5653 */

/** tanstack table api */
const table = useVueTable({
  /** https://github.com/TanStack/table/discussions/4455 */
  get data() {
    return props.rows;
  },
  get columns() {
    return columns.value;
  },
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFacetedRowModel: getFacetedRowModel(),
  getFacetedUniqueValues: getFacetedUniqueValues(),
  getFacetedMinMaxValues: getFacetedMinMaxValues(),
  initialState: {
    sorting: props.sort,
    pagination: {
      pageIndex: 0,
      pageSize: printing.value ? 9999 : 10,
    },
  },
});

/** get cell style from col definition */
const cellStyle = (col?: Cols[number]) => ({
  textAlign: col?.align ?? "center",
  justifyContent: {
    left: "flex-start",
    center: "center",
    right: "flex-end",
  }[col?.align ?? "center"],
  ...col?.style,
});

/** get cell attrs from col definition */
const cellAttrs = (col?: Cols[number], row?: Row) => {
  if (typeof col?.attrs === "object") return col?.attrs;
  if (typeof col?.attrs === "function") return col?.attrs(row);
  return {};
};
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.controls {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  gap: 20px;
}

.scroll {
  width: var(--full);
  max-width: max-content;
  overflow-x: auto;
  border-radius: var(--rounded);
  box-shadow: var(--shadow);
}

@media print {
  .scroll {
    display: contents;
  }
}

.th,
.td {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 10px;
  gap: 10px;
}

.icon-inactive {
  color: var(--light-gray);
}

.icon-active {
  color: var(--theme);
}

@media print {
  .icon-inactive,
  .icon-active {
    display: none;
  }
}

.empty {
  padding: 5px;
  color: var(--dark-gray);
  text-align: center;
}
</style>
