"use client";

import { Button } from "@/components/ui/button";
import { ImportIcon, Loader2 } from "lucide-react";
import { useState } from "react";

async function importLocalStorageFromJSON(file: File): Promise<void> {
    try {
        const text = await file.text();
        const data: Record<string, unknown> = JSON.parse(text);

        Object.entries(data).forEach(([key, value]) => {
            try {
                localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
            } catch (error) {
                console.error(`Error importing key ${key}:`, error);
            }
        });
    } catch (error) {
        console.error('Failed to import data:', error);
        throw new Error('Invalid backup file format');
    }
}

export default function ImportData() {
    const [isImporting, setIsImporting] = useState(false);

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        
        setIsImporting(true);
        try {
            await importLocalStorageFromJSON(file);
            // Reset the input
            event.target.value = '';
        } catch (error) {
            console.error('Import failed:', error);
        } finally {
            setIsImporting(false);
            window.location.reload();
        }
    };

    return (
        <div className="relative">
            <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="absolute inset-0 opacity-0 cursor-pointer w-full"
            />
            <Button
                variant="outline"
                className="text-black h-10 font-bold text-sm border-2 border-black justify-between w-full hover:bg-primary/30 bg-neutral-100 dark:neutral-900 hover:text-primary-foreground neo-brutalist-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            >
                {isImporting ? (
                    <Loader2 className="animate-spin" />
                ) : (
                    <>Import data <ImportIcon className="h-4 w-4" /></>
                )}
            </Button>
        </div>
    );
}
