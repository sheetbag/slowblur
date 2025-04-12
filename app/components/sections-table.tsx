"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  RowData,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TimeInput } from "@/components/ui/time-input";
import { Trash2, Plus, Play, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditableTextCell } from "@/components/ui/editable-text-cell";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Kbd } from "@/components/ui/kbd"

// Define the shape of a loop section
export type Section = {
  id: string;
  name: string;
  startTime: number | null;
  endTime: number | null;
};

// Declare module augmentation for table meta
declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    activeLoopSectionId: string | null;
    setActiveLoopSectionId: (id: string | null) => void;
    updateSectionName: (sectionId: string, newName: string) => void;
    updateSectionTime: (
      sectionId: string,
      field: "startTime" | "endTime",
      value: number | null
    ) => void;
    deleteSection: (sectionId: string) => void;
    addSection: () => void;
    playSection: (sectionId: string) => void;
  }
}

// Define approximate column widths (6 columns now)
const activeWidth = "50px";
const playWidth = "30px";
const nameWidth = "25%";
const startTimeWidth = "25%";
const endTimeWidth = "25%";
const deleteWidth = "20px";

// Define table columns in the new order
const sectionColumns: ColumnDef<Section>[] = [
  {
    id: "active",
    header: () => null,
    cell: ({ row, table }) => {
      const { activeLoopSectionId, setActiveLoopSectionId } = table.options.meta!;
      const isActive = row.original.id === activeLoopSectionId;
      return (
        <div className="flex items-center justify-center pl-2">
          <Switch
            id={`active-loop-${row.original.id}`}
            checked={isActive}
            onCheckedChange={(checked) => {
              setActiveLoopSectionId(checked ? row.original.id : null);
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      );
    },
    meta: { align: "center" },
  },
  {
    id: "play",
    header: () => null,
    cell: ({ row, table }) => {
      const { playSection } = table.options.meta!;
      const shortcutKey = row.index < 9 ? (row.index + 1).toString() : null;
      return (
        <div className="flex items-center justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-opacity"
                onClick={() => playSection(row.original.id)}
                disabled={row.original.startTime === null}
              >
                <Play className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                Play
                {shortcutKey && <Kbd className="ml-1">{shortcutKey}</Kbd>}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      );
    },
    meta: { align: "center" },
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row, table }) => {
      const { updateSectionName } = table.options.meta!;
      return (
        <EditableTextCell
          value={row.original.name}
          onSave={(newName) => updateSectionName(row.original.id, newName)}
        />
      );
    },
    meta: { align: "center" },
  },
  {
    accessorKey: "startTime",
    header: "Start",
    cell: ({ row, table }) => {
      const { updateSectionTime } = table.options.meta!;
      return (
        <TimeInput
          value={row.original.startTime}
          onChange={(value) =>
            updateSectionTime(row.original.id, "startTime", value)
          }
          className="h-8"
        />
      );
    },
    meta: { align: "center" },
  },
  {
    accessorKey: "endTime",
    header: "End",
    cell: ({ row, table }) => {
      const { updateSectionTime } = table.options.meta!;
      return (
        <TimeInput
          value={row.original.endTime}
          onChange={(value) =>
            updateSectionTime(row.original.id, "endTime", value)
          }
          className="h-8"
        />
      );
    },
    meta: { align: "center" },
  },
  {
    id: "delete",
    header: () => null,
    cell: ({ row, table }) => {
      const { deleteSection } = table.options.meta!;
      return (
        <div className="flex items-center justify-end -translate-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-opacity"
            onClick={() => deleteSection(row.original.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    },
    meta: { align: "center" },
  },
];

// Define props for the table component
export interface SectionsTableProps {
  sections: Section[];
  activeLoopSectionId: string | null;
  setActiveLoopSectionId: (id: string | null) => void;
  updateSectionName: (sectionId: string, newName: string) => void;
  updateSectionTime: (
    sectionId: string,
    field: "startTime" | "endTime",
    value: number | null
  ) => void;
  deleteSection: (sectionId: string) => void;
  addSection: () => void;
  playSection: (sectionId: string) => void;
}

export function SectionsTable({
  sections,
  activeLoopSectionId,
  setActiveLoopSectionId,
  updateSectionName,
  updateSectionTime,
  deleteSection,
  addSection,
  playSection,
}: SectionsTableProps) {
  const table = useReactTable({
    data: sections,
    columns: sectionColumns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    meta: {
      activeLoopSectionId,
      setActiveLoopSectionId,
      updateSectionName,
      updateSectionTime,
      deleteSection,
      addSection,
      playSection,
    },
  });

  const getAlignmentClass = (align: string | undefined): string => {
    if (align === "right") return "text-right";
    if (align === "center") return "text-center";
    return "text-left";
  };

  return (
    <TooltipProvider>
      <div className="border rounded-md overflow-hidden w-full max-w-full mx-auto">
        <Table className="table-fixed w-full">
          <colgroup>
            <col style={{ width: activeWidth }} />
            <col style={{ width: playWidth }} />
            <col style={{ width: nameWidth }} />
            <col style={{ width: startTimeWidth }} />
            <col style={{ width: endTimeWidth }} />
            <col style={{ width: deleteWidth }} />
          </colgroup>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "h-10 px-2 text-sm",
                      getAlignmentClass((header.column.columnDef.meta as any)?.align)
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="group">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "p-1 text-sm",
                        getAlignmentClass((cell.column.columnDef.meta as any)?.align)
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={sectionColumns.length} className="h-[40.5px] text-center">
                  No sections defined.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="p-0 border-t text-muted-foreground">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={addSection}
                className="w-full h-8 rounded-none font-normal"
              >
                <Plus className="h-4 w-4" />
                Add Section
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-center">
              <p>
                Click to add a new empty section, or use <Kbd>[</Kbd> to mark start/end times.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}