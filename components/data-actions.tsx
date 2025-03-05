"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DatabaseIcon } from "lucide-react";
import ImportData from "./import-data";
import ExportData from "./export-data";

export default function DataActions() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="text-black h-9 w-fit font-bold text-base border-2 border-black justify-center hover:bg-primary/30 bg-neutral-100 dark:neutral-900 hover:text-primary-foreground neo-brutalist-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
        >
          Data <DatabaseIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="mt-2 w-48 p-4 border-4 bg-card border-black neo-brutalist-shadow">
        <div className="flex flex-col gap-2">
          <ExportData />
          <ImportData />
        </div>
      </PopoverContent>
    </Popover>
  );
} 