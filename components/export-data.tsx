"use client";

import { Button } from "@/components/ui/button";
import { ExternalLinkIcon } from "lucide-react";

function exportLocalStorageToJSON(keys?: string[], filename: string = `planti-backup-${new Date().toISOString().split('T')[0].replaceAll('-', '')}.json`): void {
    const keysToExport = keys || Object.keys(localStorage);
    const data: Record<string, unknown> = {};

    keysToExport.forEach(key => {
        try {
            const item = localStorage.getItem(key);
            if (item) {
                // Try to parse JSON data
                try {
                    data[key] = JSON.parse(item);
                } catch {
                    // Store as string if not valid JSON
                    data[key] = item;
                }
            }
        } catch (error) {
            console.error(`Error exporting key ${key}:`, error);
        }
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export default function ExportData() {
    return (
        <Button
            variant="outline"
            onClick={() => exportLocalStorageToJSON()}
            className="text-black h-10 font-bold text-sm border-2 border-black justify-between w-full hover:bg-primary/30 bg-neutral-100 dark:neutral-900 hover:text-primary-foreground neo-brutalist-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
        >
            Export data <ExternalLinkIcon className="h-4 w-4" />
        </Button>
    );
}
