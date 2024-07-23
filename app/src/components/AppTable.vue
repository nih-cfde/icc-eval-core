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
                {{ defaultFormat(cell.getValue()) }}
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
import { truncate } from "lodash";
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
      pageSize: 999999,
    },
  },
});

/** default cell formatter based on detected type */
const defaultFormat = (cell: unknown) => {
  if (typeof cell === "number") return cell.toLocaleString();
  if (typeof cell === "boolean") return cell ? "✓" : "✗";
  /** if falsey (except 0 and false) */
  if (!cell) return "-";
  if (Array.isArray(cell)) return cell.length.toLocaleString();
  if (cell instanceof Date)
    return cell.toLocaleString(undefined, { dateStyle: "medium" });
  if (typeof cell === "object")
    return Object.keys(cell).length.toLocaleString();
  if (typeof cell === "string") return truncate(cell, { length: 100 });
  return cell;
};

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
.scroll {
  width: calc(100vw - 100px);
  max-width: max-content;
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
  align-items: flex-start;
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
