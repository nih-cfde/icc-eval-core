<template>
  <div ref="scroll" class="scroll">
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
              :style="header.column.columnDef.meta?.colProp.style"
              v-bind="header.column.columnDef.meta?.colProp.attrs"
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
        <tr v-for="row in table.getRowModel().rows.slice(0, 10)" :key="row.id">
          <td v-for="cell in row.getVisibleCells()" :key="cell.id">
            <div
              class="td"
              :style="cell.column.columnDef.meta?.colProp.style"
              v-bind="cell.column.columnDef.meta?.colProp.attrs"
            >
              <slot
                v-if="
                  cell.column.columnDef.meta?.colProp.slot &&
                  $slots[cell.column.columnDef.meta?.colProp.slot]
                "
                :name="cell.column.columnDef.meta?.colProp.slot"
                :row="row.original"
              />
              <FlexRender
                v-else
                :render="cell.column.columnDef.cell"
                :props="cell.getContext()"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
type Cell = Record<string, unknown>;

export type Cols<Rows extends Cell[]> = {
  /** key of row object to access as cell value */
  key: Extract<keyof Rows[number], string>;
  /** slot name for custom cell rendering */
  slot?: string;
  /** label for header */
  name: string;
  /** cell attributes */
  attrs?: HTMLAttributes;
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
import { type CSSProperties, type HTMLAttributes, type VNode } from "vue";
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
} from "@tanstack/vue-table";
import type { RowData, SortingState } from "@tanstack/vue-table";
import SortDown from "@/assets/sort-down.svg";
import SortUp from "@/assets/sort-up.svg";
import Sort from "@/assets/sort.svg";
import { useScrollable } from "@/util/composables";

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

const { ref: scroll } = useScrollable();

const columnHelper = createColumnHelper<Row>();

/** column definitions */
const columns = props.cols.map((col) =>
  columnHelper.accessor((row: Row) => row[col.key], {
    /** unique column id */
    id: col.key,
    /** name */
    header: col.name,
    /** sortable */
    enableSorting: true,
    /** extra metadata */
    meta: {
      colProp: col,
    },
  }),
);

/** tanstack table api */
const table = useVueTable({
  data: props.rows,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFacetedRowModel: getFacetedRowModel(),
  getFacetedUniqueValues: getFacetedUniqueValues(),
  getFacetedMinMaxValues: getFacetedMinMaxValues(),
  initialState: {
    sorting: props.sort,
  },
});
</script>

<style scoped>
.scroll {
  max-width: 100%;
  overflow-x: auto;
  border-radius: var(--rounded);
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
  color: var(--gray);
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
</style>
